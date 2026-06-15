
import React, { useState, useEffect, useRef } from 'react';
import { User, DonationType, FoodStatus, FoodPosting } from '../types';
import { storage } from '../services/storageService';
import { analyzeFoodSafetyImage, analyzeClothesImage, transcribeAudio } from '../services/geminiService';
import { reverseGeocodeGoogle, getCurrentLocation } from '../services/mapLoader';
import LocationPickerMap from './LocationPickerMap';
import PaymentModal from './PaymentModal';
import { triggerHaptic } from '../services/haptics';

interface AddDonationViewProps {
  user: User;
  initialType?: DonationType;
  onBack: () => void;
  onSuccess: (posting?: FoodPosting) => void;
}

const AddDonationView: React.FC<AddDonationViewProps> = ({ user, initialType = 'FOOD', onBack, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form State
  const [donationType, setDonationType] = useState<DonationType>(initialType);
  const [foodName, setFoodName] = useState('');
  const [foodDescription, setFoodDescription] = useState('');
  const [quantityNum, setQuantityNum] = useState('');
  const [unit, setUnit] = useState(initialType === 'FOOD' ? 'meals' : 'items');
  const [expiryDate, setExpiryDate] = useState('');
  
  // Media State
  const [foodImage, setFoodImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [safetyVerdict, setSafetyVerdict] = useState<{isSafe: boolean, reasoning: string} | undefined>(undefined);
  const [aiAutofilled, setAiAutofilled] = useState(false);
  
  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Location State
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);

  // Payment & Upload State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Address Population
  useEffect(() => {
    if (user.address) {
        setLine1(user.address.line1 || '');
        setLine2(user.address.line2 || '');
        setLandmark(user.address.landmark || '');
        setPincode(user.address.pincode || '');
        setLat(user.address.lat);
        setLng(user.address.lng);
    } else {
        // Initial Geolocation if no address
        getCurrentLocation()
            .then(pos => {
                setLat(pos.lat);
                setLng(pos.lng);
            })
            .catch(() => {});
    }
  }, [user]);

  // Robust Camera Lifecycle Management
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
        setIsCameraLoading(true);
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera Error:", err);
            alert("Unable to access camera. Please upload a photo instead.");
            setIsCameraOpen(false);
        } finally {
            setIsCameraLoading(false);
        }
    };

    if (isCameraOpen) {
        initCamera();
    }

    return () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
    };
  }, [isCameraOpen]);

  const handleTypeChange = (type: DonationType) => {
      triggerHaptic('selection');
      setDonationType(type);
      setUnit(type === 'FOOD' ? 'meals' : 'items');
      if (foodImage) processImage(foodImage, type);
      setCurrentStep(1); // Auto advance
  };

  // --- Helpers for Quick Expiry ---
  const setQuickExpiry = (hours: number) => {
      triggerHaptic('selection');
      const date = new Date();
      date.setHours(date.getHours() + hours);
      // Format: YYYY-MM-DDTHH:mm
      const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setExpiryDate(localIso);
  };

  // --- Camera & Image Logic ---
  const startCamera = () => { 
      setFoodImage(null); 
      setSafetyVerdict(undefined);
      setIsCameraOpen(true); 
  };

  const stopCamera = () => { 
      setIsCameraOpen(false); 
  };

  const capturePhoto = async () => { 
      triggerHaptic('impactHeavy'); // Shutter feel
      if (videoRef.current && canvasRef.current) { 
          const v = videoRef.current; 
          const c = canvasRef.current;
          
          if (v.readyState === v.HAVE_ENOUGH_DATA) {
              const s = v.videoWidth > 800 ? 800/v.videoWidth : 1; 
              c.width = v.videoWidth * s; 
              c.height = v.videoHeight * s; 
              c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height); 
              const b64 = c.toDataURL('image/jpeg', 0.8); 
              stopCamera(); 
              processImage(b64, donationType);
          }
      } 
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
      const f = e.target.files?.[0]; 
      if (f) { 
          const r = new FileReader(); 
          r.onloadend = () => { 
              const i = new Image(); 
              i.onload = () => { 
                  const c = document.createElement('canvas'); 
                  const s = i.width > 800 ? 800/i.width : 1; 
                  c.width = i.width * s; 
                  c.height = i.height * s; 
                  c.getContext('2d')?.drawImage(i, 0, 0, c.width, c.height); 
                  processImage(c.toDataURL('image/jpeg', 0.8), donationType); 
              }; 
              i.src = r.result as string; 
          }; 
          r.readAsDataURL(f); 
          e.target.value = ''; // Reset to allow same file re-upload
      } 
  };

  const processImage = async (base64: string, type: DonationType) => {
      setFoodImage(base64);
      setIsAnalyzing(true);
      setSafetyVerdict(undefined);
      setAiAutofilled(false);
      
      try {
          let analysis;
          if (type === 'CLOTHES') analysis = await analyzeClothesImage(base64);
          else analysis = await analyzeFoodSafetyImage(base64);
          
          setSafetyVerdict({ isSafe: analysis.isSafe, reasoning: analysis.reasoning });
          
          // Smart Auto-Fill
          if (analysis.detectedFoodName && !analysis.detectedFoodName.includes("Donation")) {
              setFoodName(analysis.detectedFoodName);
              setFoodDescription(analysis.reasoning); // Use reasoning as initial description
              setAiAutofilled(true);
              triggerHaptic('success');
              setTimeout(() => setAiAutofilled(false), 3000); // Hide animation
          }
      } catch (error) {
          console.error("Analysis failed", error);
      } finally {
          setIsAnalyzing(false);
      }
  };

  // --- Audio Logic ---
  const startRecording = async () => { 
      try { 
          const s = await navigator.mediaDevices.getUserMedia({ audio: true }); 
          const mt = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'; 
          const mr = new MediaRecorder(s, { mimeType: mt }); 
          mediaRecorderRef.current = mr; 
          audioChunksRef.current = []; 
          mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); }; 
          mr.onstop = async () => { 
              const b = new Blob(audioChunksRef.current, { type: mt }); 
              const r = new FileReader(); 
              r.readAsDataURL(b); 
              r.onloadend = async () => { 
                  const t = await transcribeAudio(r.result as string, mt); 
                  if (t) setFoodDescription(p => p ? `${p} ${t}` : t); 
              }; 
              s.getTracks().forEach(t => t.stop()); 
          }; 
          mr.start(); 
          setIsRecording(true); 
          triggerHaptic('impactLight');
      } catch (e) { alert("Mic error."); } 
  };

  const stopRecording = () => { 
      if (mediaRecorderRef.current && isRecording) { 
          mediaRecorderRef.current.stop(); 
          setIsRecording(false); 
          triggerHaptic('impactLight');
      } 
  };

  // --- Location Logic ---
  const handleAutoDetectLocation = async () => {
    setIsAutoDetecting(true);
    setIsAddressLoading(true); // Show loading skeleton on inputs
    
    try {
        const pos = await getCurrentLocation();
        const { lat, lng } = pos;
        
        // Update Map View
        setLat(lat); 
        setLng(lng);
        
        // Attempt reverse geocoding to fill address fields
        const a = await reverseGeocodeGoogle(lat, lng); 
        if (a) { 
            setLine1(a.line1); 
            setLine2(a.line2); 
            setLandmark(a.landmark || ''); 
            setPincode(a.pincode); 
        }
        triggerHaptic('success');
    } catch (error: any) {
        alert(error.message || "Could not detect location.");
        triggerHaptic('error');
    } finally { 
        setIsAutoDetecting(false); 
        setIsAddressLoading(false);
    }
  };

  // --- Submission Logic ---
  const handleNext = () => {
      // Validation for transitions
      if (currentStep === 1 && !foodImage) { alert("Please take a photo first."); return; }
      if (currentStep === 2 && (!foodName || !quantityNum || !expiryDate)) { alert("Please fill in all details."); return; }
      if (currentStep === 3) {
          if(!line1 || !pincode) { alert("Address required"); return; }
          handleInitiatePayment();
          return;
      }
      triggerHaptic('selection');
      setCurrentStep(prev => prev + 1);
  };

  const handleInitiatePayment = () => { 
      setIsProcessingPayment(true); 
      setShowPaymentModal(true); 
  };

  const handlePaymentSuccess = async () => {
    // Close payment modal immediately to show the upload overlay in the main view
    setShowPaymentModal(false);
    setIsProcessingPayment(false);

    let interval: any = null;
    try {
        setIsUploading(true);
        setUploadProgress(0);

        // Robust sanitation & fallback for missing location
        const cleanLocation = {
            line1: line1 || 'Unknown Street',
            line2: line2 || '',
            landmark: landmark || '',
            pincode: pincode || '000000',
            lat: lat ?? 20.5937, 
            lng: lng ?? 78.9629
        };

        const newPost: FoodPosting = { 
            id: Math.random().toString(36).substr(2, 9), 
            donationType, 
            donorId: user.id, 
            donorName: user.name || 'Donor', 
            donorOrg: user.orgName || '',
            isDonorVerified: user.isVerified || false,
            foodName: foodName.trim() || 'Food Donation', 
            description: foodDescription || '', 
            quantity: `${quantityNum} ${unit}`, 
            location: cleanLocation, 
            expiryDate, 
            status: FoodStatus.AVAILABLE, 
            imageUrl: foodImage!, 
            safetyVerdict: safetyVerdict || { isSafe: true, reasoning: 'Manual entry' }, 
            foodTags: [], 
            createdAt: Date.now(), 
            platformFeePaid: true 
        };
        
        // Simulate upload progress
        interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) return 90;
                return prev + 10;
            });
        }, 150);

        // Actual save operation
        console.log("Saving new posting...", newPost);
        await storage.savePosting(newPost);
        
        setUploadProgress(100);
        triggerHaptic('success');
        
        await new Promise(r => setTimeout(r, 600));

        // Update UI logic
        setIsUploading(false);
        onSuccess(newPost);
    } catch (error) {
        console.error("Donation upload failed:", error);
        alert("Failed to save donation. Please check your internet connection and try again.");
        triggerHaptic('error');
        setIsUploading(false);
    } finally {
        if (interval) clearInterval(interval);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-fade-in-up relative perspective-1000">
        {/* Upload Progress Overlay */}
        {isUploading && (
            <div className="fixed inset-0 z-[1100] bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in-up">
                <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] border border-slate-300 dark:border-white/20 p-10 max-w-sm w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] relative">
                    <div className="relative w-28 h-28 mx-auto mb-8">
                        <div className="absolute inset-0 border-[6px] border-slate-200/30 dark:border-slate-700/30 rounded-full"></div>
                        <div className="absolute inset-0 border-[6px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-4xl drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">✨</div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight drop-shadow-md">Manifesting...</h3>
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 glow glow-emerald-500/20">Digitalizing Donation</p>
                    
                    <div className="w-full bg-slate-100/50 dark:bg-slate-800/50 rounded-full h-4 mb-3 overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                        <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                            style={{ width: `${uploadProgress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 animate-[pulse_1.5s_infinite]"></div>
                        </div>
                    </div>
                    <p className="text-xs font-black text-emerald-400 drop-shadow-sm">{Math.round(uploadProgress)}% Complete</p>
                </div>
            </div>
        )}

        {/* Header & Progress */}
        <div className="flex items-center justify-between mb-8">
            <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-emerald-500 transition-colors group">
                <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Abort
            </button>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] drop-shadow-md text-center flex-1">
                {currentStep === 0 ? 'Protocol' : currentStep === 1 ? 'Visuals' : currentStep === 2 ? 'Data Entry' : 'Deployment'}
            </h2>
            <div className="w-20 text-right px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 dark:bg-white text-slate-900 dark:text-white dark:text-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-300 text-[10px] font-black uppercase tracking-widest shadow-md">
                [{currentStep + 1}/4]
            </div>
        </div>

        {/* Progress Timeline */}
        <div className="w-full h-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-full mb-10 overflow-hidden shadow-inner backdrop-blur-sm border border-slate-300/50 dark:border-slate-700/50">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ width: `${((currentStep + 1) / 4) * 100}%` }}>
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-white/50 dark:border-white/10 relative min-h-[550px] flex flex-col transform-gpu transition-all duration-700">
            
            {/* Step 1: Type Selection */}
            {currentStep === 0 && (
                <div className="p-10 flex-1 flex flex-col justify-center animate-fade-in-up">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-10 text-center tracking-tight drop-shadow-sm">Select Primary Resource Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button 
                            onClick={() => handleTypeChange('FOOD')} 
                            className="p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/20 hover:border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.05)] hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all duration-500 group text-left relative overflow-hidden transform hover:-translate-y-2 hover:rotate-1"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-50 group-hover:opacity-100 duration-700"></div>
                            <span className="text-7xl mb-6 block group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-500 origin-left">🍱</span>
                            <div className="relative z-10">
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Sustenance</h4>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">Meals, packaged goods, or raw ingredients.</p>
                            </div>
                        </button>
                        <button 
                            onClick={() => handleTypeChange('CLOTHES')} 
                            className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-2 border-indigo-500/20 hover:border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.05)] hover:shadow-[0_0_40px_rgba(99,102,241,0.2)] transition-all duration-500 group text-left relative overflow-hidden transform hover:-translate-y-2 hover:-rotate-1"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-50 group-hover:opacity-100 duration-700"></div>
                            <span className="text-7xl mb-6 block group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-500 origin-left">👕</span>
                            <div className="relative z-10">
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Apparel</h4>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">Wearable items, blankets, or footwear.</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Camera & Analysis */}
            {currentStep === 1 && (
                <div className="p-8 md:p-10 flex-1 flex flex-col animate-fade-in-up">
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="space-y-4 flex-1">
                        {!isCameraOpen && !foodImage && (
                            <div className="h-full flex flex-col items-center justify-center border-[3px] border-dashed border-slate-300/50 dark:border-slate-700/50 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-800/20 p-8 shadow-inner relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="mb-10 text-center relative z-10">
                                    <div className="w-24 h-24 mx-auto bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-5xl mb-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-700 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">📸</div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight drop-shadow-sm">Capture the Evidence</h3>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-3">Our Intelligence engine will evaluate safety protocols and auto-populate parameters.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm relative z-10">
                                    <button onClick={startCamera} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 dark:text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] transition-all">Engage Optics</button>
                                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:border-slate-300 dark:hover:border-slate-600 shadow-sm">Upload DB</button>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>
                        )}

                        {isCameraOpen && (
                            <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-[3/4] md:aspect-video shadow-2xl border border-slate-200 dark:border-white/10 ring-4 ring-black/5">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-105" />
                                
                                {isCameraLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                                        <div className="relative w-16 h-16">
                                            <div className="absolute inset-0 border-4 border-slate-600 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </div>
                                )}

                                {/* Camera UI Overlay */}
                                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none"></div>
                                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none"></div>

                                <div className="absolute bottom-8 inset-x-0 flex justify-center items-center gap-8 z-20">
                                    <button onClick={stopCamera} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-slate-300 dark:border-white/20 flex items-center justify-center text-slate-900 dark:text-white hover:bg-white/20 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                    <button onClick={capturePhoto} className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full border-[6px] border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform relative group">
                                        <div className="absolute inset-2 rounded-full bg-white group-hover:scale-95 transition-transform"></div>
                                    </button>
                                    <div className="w-12 h-12"></div> {/* Spacer for symmetry */}
                                </div>
                            </div>
                        )}
                        
                        {foodImage && (
                            <div className="relative rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-2xl group h-full border border-slate-200 dark:border-slate-800">
                                <img src={foodImage} className="w-full h-full object-cover opacity-90 transition-transform duration-[10s] group-hover:scale-110 ease-linear" />
                                <button onClick={() => setFoodImage(null)} className="absolute top-6 right-6 bg-black/40 text-slate-900 dark:text-white p-3.5 rounded-2xl hover:bg-black/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 transition-all z-20 shadow-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                                
                                <div className="absolute bottom-0 inset-x-0 p-8 pt-20 bg-gradient-to-t from-black via-black/80 to-transparent z-10">
                                    {isAnalyzing ? (
                                        <div className="flex flex-col items-center gap-4 text-slate-900 dark:text-white">
                                            <div className="relative w-16 h-16">
                                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                                                <div className="absolute inset-2 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                <div className="absolute inset-0 flex items-center justify-center text-xl">🧠</div>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse">Running Neural Diagnostics...</span>
                                        </div>
                                    ) : safetyVerdict && (
                                        <div className="animate-fade-in-up bg-black/40 backdrop-blur-md border border-slate-200 dark:border-white/10 p-5 rounded-2xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${safetyVerdict?.isSafe ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 glow glow-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border-rose-500/30 glow glow-rose-500/20'}`}>
                                                    {safetyVerdict?.isSafe ? 'Clearance Granted' : 'Anomaly Detected'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 font-bold leading-relaxed">{safetyVerdict?.reasoning}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Next Button */}
                    <div className="mt-8">
                        <button 
                            onClick={handleNext} 
                            disabled={!foodImage || isAnalyzing}
                            className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all duration-300 shadow-xl border ${!foodImage || isAnalyzing ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)]'}`}
                        >
                            {isAnalyzing ? 'Processing...' : 'Proceed to Data Link'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Details */}
            {currentStep === 2 && (
                <div className="p-8 md:p-10 flex-1 flex flex-col animate-fade-in-up overflow-y-auto custom-scrollbar">
                    {aiAutofilled && (
                        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden group animate-fade-in-up">
                            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors pointer-events-none"></div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl shrink-0 border border-emerald-500/30">✨</div>
                            <div>
                                <h4 className="text-sm font-black text-slate-800 dark:text-emerald-400 uppercase tracking-widest drop-shadow-sm">Intelligence Uplink Success</h4>
                                <p className="text-xs font-bold text-slate-500 dark:text-emerald-500/80 mt-1">Data parameters successfully localized from imaging.</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8 flex-1">
                        <div className="relative group">
                            <input type="text" id="foodName" placeholder=" " value={foodName} onChange={e => setFoodName(e.target.value)} className="peer w-full px-6 py-5 border-[3px] border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-all shadow-inner" required />
                            <label htmlFor="foodName" className="absolute left-5 top-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 dark:text-slate-500 transition-all peer-focus:-top-3 peer-focus:left-4 peer-focus:text-emerald-500 peer-focus:scale-90 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:scale-90 bg-white dark:bg-slate-900 px-2 rounded-md pointer-events-none">Designation</label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="relative group flex">
                                <input type="number" id="quantity" placeholder=" " value={quantityNum} onChange={e => setQuantityNum(e.target.value)} className="peer w-full px-6 py-5 border-[3px] border-r-0 border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 rounded-l-2xl font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all shadow-inner" required />
                                <label htmlFor="quantity" className="absolute left-5 top-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 dark:text-slate-500 transition-all peer-focus:-top-3 peer-focus:left-4 peer-focus:text-emerald-500 peer-focus:scale-90 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:scale-90 bg-white dark:bg-slate-900 px-2 rounded-md pointer-events-none z-10">Volume</label>
                                <select value={unit} onChange={e => setUnit(e.target.value)} className="px-4 py-5 border-[3px] border-slate-200/50 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800 rounded-r-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <option value="meals">Meals</option>
                                    <option value="kg">Kg</option>
                                    <option value="items">Units</option>
                                    <option value="boxes">Crates</option>
                                </select>
                            </div>
                            <div className="relative group">
                                <input type="datetime-local" id="expiry" placeholder=" " value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="peer w-full px-6 py-5 border-[3px] border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-900 dark:text-white text-sm focus:bg-white dark:focus:bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all shadow-inner" required />
                                <label htmlFor="expiry" className="absolute left-5 -top-3 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-white dark:bg-slate-900 px-2 rounded-md pointer-events-none">{donationType === 'FOOD' ? 'Critical Expiry' : 'Est. Limit'}</label>
                            </div>
                        </div>

                        {/* Quick Expiry Chips */}
                        {donationType === 'FOOD' && (
                            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mt-4">
                                <button onClick={() => setQuickExpiry(2)} className="px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-900 dark:text-white transition-all whitespace-nowrap">+2 Hrs</button>
                                <button onClick={() => setQuickExpiry(4)} className="px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-900 dark:text-white transition-all whitespace-nowrap">+4 Hrs</button>
                                <button onClick={() => setQuickExpiry(24)} className="px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-900 dark:text-white transition-all whitespace-nowrap">+24 Hrs</button>
                            </div>
                        )}

                        <div className="relative group">
                            <textarea id="desc" placeholder=" " value={foodDescription} onChange={e => setFoodDescription(e.target.value)} className="peer w-full px-6 py-5 border-[3px] border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl font-bold text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all resize-none h-32 shadow-inner" />
                            <label htmlFor="desc" className="absolute left-5 top-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 dark:text-slate-500 transition-all peer-focus:-top-3 peer-focus:left-4 peer-focus:text-emerald-500 peer-focus:scale-90 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:scale-90 bg-white dark:bg-slate-900 px-2 rounded-md pointer-events-none">Additional Intel</label>
                            
                            {/* Audio Recording Button inside textarea */}
                            <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`absolute bottom-4 right-4 p-3 rounded-xl transition-all ${isRecording ? 'bg-rose-500 text-slate-900 dark:text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button onClick={() => setCurrentStep(1)} className="px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">Revert</button>
                        <button onClick={handleNext} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all border border-slate-900 dark:border-white">Lock Coordinates</button>
                    </div>
                </div>
            )}

            {/* Step 4: Location */}
            {currentStep === 3 && (
                <div className="flex-1 flex flex-col animate-fade-in-up bg-slate-50/30 dark:bg-slate-900/50 rounded-b-[2.5rem]">
                    <div className="relative h-[250px] md:h-[300px] border-b border-slate-200/50 dark:border-slate-700/50 ring-1 ring-black/5 overflow-hidden">
                        <LocationPickerMap 
                            lat={lat} 
                            lng={lng} 
                            onLocationSelect={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} 
                            onLookupStart={() => setIsAddressLoading(true)}
                            onAddressFound={(addr) => { 
                                setLine1(addr.line1); 
                                setLine2(addr.line2); 
                                setLandmark(addr.landmark || ''); 
                                setPincode(addr.pincode);
                                setIsAddressLoading(false);
                            }} 
                        />
                        
                        {/* Integrated Auto Detect Button */}
                        <div className="absolute top-4 right-4 z-[400]">
                            <button 
                                type="button" 
                                onClick={handleAutoDetectLocation} 
                                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-3 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] border border-slate-200/50 dark:border-slate-600/50 transition-all duration-300 flex items-center gap-2 group active:scale-95"
                            >
                                {isAutoDetecting ? (
                                    <svg className="animate-spin w-5 h-5 text-emerald-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] hidden sm:inline">Auto-Detect</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Map Overlay Gradient */}
                        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-50/80 dark:from-slate-900/80 to-transparent pointer-events-none"></div>
                    </div>
                    
                    <div className="p-8 space-y-6 flex-1 relative z-10 -mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-[0.2em] drop-shadow-sm">Extract Coordinates</h3>
                            {isAddressLoading && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 animate-pulse bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Syncing...</span>}
                        </div>

                        <div className={`space-y-6 transition-opacity duration-500 ${isAddressLoading ? 'opacity-50 pointer-events-none scale-[0.98]' : 'opacity-100 scale-100'}`}>
                            <div className="relative group">
                                <input type="text" id="line1" placeholder=" " value={line1} onChange={e => setLine1(e.target.value)} className="peer w-full px-6 py-4 border-[3px] border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl font-black text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all shadow-inner" required />
                                <label htmlFor="line1" className="absolute left-5 top-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 dark:text-slate-500 transition-all peer-focus:-top-3 peer-focus:left-4 peer-focus:text-emerald-500 peer-focus:scale-90 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:scale-90 bg-slate-50 dark:bg-slate-900 px-2 rounded-md pointer-events-none">Primary Nexus</label>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative group">
                                    <input type="text" id="landmark" placeholder=" " value={landmark} onChange={e => setLandmark(e.target.value)} className="peer w-full px-6 py-4 border-[3px] border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl font-black text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all shadow-inner" />
                                    <label htmlFor="landmark" className="absolute left-5 top-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 dark:text-slate-500 transition-all peer-focus:-top-3 peer-focus:left-4 peer-focus:text-emerald-500 peer-focus:scale-90 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:scale-90 bg-slate-50 dark:bg-slate-900 px-2 rounded-md pointer-events-none">Visual Landmark</label>
                                </div>
                                <div className="relative group">
                                    <input type="text" id="pincode" placeholder=" " value={pincode} onChange={e => setPincode(e.target.value)} className="peer w-full px-6 py-4 border-[3px] border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl font-black text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all shadow-inner" required />
                                    <label htmlFor="pincode" className="absolute left-5 top-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 dark:text-slate-500 transition-all peer-focus:-top-3 peer-focus:left-4 peer-focus:text-emerald-500 peer-focus:scale-90 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:scale-90 bg-slate-50 dark:bg-slate-900 px-2 rounded-md pointer-events-none">Zone Code</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 dark:bg-black p-8 text-slate-900 dark:text-white rounded-b-[2.5rem] relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
                        
                        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-white/10 pb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-[1rem] flex items-center justify-center text-xl backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-inner">₹</div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 glow glow-emerald-500/20 mb-1">Network Access Fee</p>
                                    <p className="font-bold text-slate-600 dark:text-slate-300 text-xs">Micropayment bridge</p>
                                </div>
                            </div>
                            <span className="text-4xl font-black drop-shadow-md">₹5</span>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <button onClick={() => setCurrentStep(2)} className="px-8 py-5 bg-white/10 text-slate-900 dark:text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all border border-slate-200 dark:border-white/10 backdrop-blur-sm">Revert</button>
                            <button onClick={handleNext} disabled={isProcessingPayment || isAddressLoading} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-900 dark:text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3">
                                {isProcessingPayment ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4 text-slate-900 dark:text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Handshake...
                                    </>
                                ) : 'Authorize & Broadcast'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {showPaymentModal && (
            <PaymentModal 
                amount={5} 
                onSuccess={handlePaymentSuccess} 
                onCancel={() => { setShowPaymentModal(false); setIsProcessingPayment(false); }}
            />
        )}
    </div>
  );
};

export default AddDonationView;
