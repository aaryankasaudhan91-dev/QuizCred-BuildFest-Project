import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FoodPosting, User, UserRole, FoodStatus } from '../types';
import { generateSpeech, askWithMaps } from '../services/geminiService';
import { calculateDistance } from '../services/storageService';
import { getTranslation } from '../services/translations';
import { triggerHaptic } from '../services/haptics';

interface FoodCardProps {
  posting: FoodPosting;
  user: User;
  onUpdate: (id: string, updates: Partial<FoodPosting>) => void;
  onDelete?: (id: string) => void;
  onClose?: () => void;
  currentLocation?: { lat: number; lng: number };
  onRateUser?: (postingId: string, targetId: string, targetName: string, rating: number, feedback: string) => void;
  onChatClick?: (postingId: string) => void;
  onTrackClick?: (postingId: string) => void;
  onDirectionsClick?: (posting: FoodPosting) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
            resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const FoodCard: React.FC<FoodCardProps> = ({ 
    posting, user, onUpdate, onDelete, onClose, currentLocation, onRateUser, onChatClick, onTrackClick,
    onDirectionsClick, selectable, selected, onToggleSelect 
}) => {
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showAiWarning, setShowAiWarning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSafetyDetails, setShowSafetyDetails] = useState(false);
  const [isPickingUp, setIsPickingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [locationInsight, setLocationInsight] = useState<{text: string, sources: any[]} | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  
  const t = (key: string) => getTranslation(key, user?.language);

  const isClothes = posting.donationType === 'CLOTHES';
  const expiryTimestamp = new Date(posting.expiryDate).getTime();
  const creationTimestamp = posting.createdAt || (expiryTimestamp - (12 * 60 * 60 * 1000));
  const totalDuration = expiryTimestamp - creationTimestamp;
  const timeRemaining = expiryTimestamp - Date.now();
  const hoursLeft = timeRemaining / (1000 * 60 * 60);
  const progressPercent = Math.max(0, Math.min(100, (timeRemaining / totalDuration) * 100));
  const isUrgent = posting.status === FoodStatus.AVAILABLE && hoursLeft > 0 && hoursLeft < (isClothes ? 24 : 6);

  const distanceText = useMemo(() => {
    if (currentLocation && posting.location.lat && posting.location.lng) {
      const dist = calculateDistance(currentLocation.lat, currentLocation.lng, posting.location.lat, posting.location.lng);
      return `${dist.toFixed(1)} km`;
    }
    return null;
  }, [currentLocation, posting.location]);

  // Check if current user has already rated for this posting
  const myRating = posting.ratings?.find(r => r.raterId === user.id);

  const initiateRequest = () => {
    if (!user) return;
    triggerHaptic('impactMedium');
    setShowAiWarning(true);
  };

  const confirmRequest = () => {
    if (!user) return;
    triggerHaptic('success');
    onUpdate(posting.id, { status: FoodStatus.REQUESTED, orphanageId: user.id, orphanageName: user.orgName || user.name || 'Requester', requesterAddress: user.address });
    setShowAiWarning(false);
  };

  const handleExpressInterest = () => {
    if (!user) return;
    const isAlreadyInterested = posting.interestedVolunteers?.some(v => v.userId === user.id);
    if (isAlreadyInterested) { alert("Already interested."); return; }
    triggerHaptic('success');
    onUpdate(posting.id, { interestedVolunteers: [...(posting.interestedVolunteers || []), { userId: user.id, userName: user.name || 'Volunteer' }] });
    alert("Interest recorded! The donor will be notified.");
  };

  const handleAcceptMission = () => {
    if (!user) return;
    triggerHaptic('success');
    setIsAccepting(true);
    // Directly assign the volunteer and notify
    onUpdate(posting.id, { 
        volunteerId: user.id, 
        volunteerName: user.name || 'Volunteer',
        interestedVolunteers: [] // Clear interest list as it's now assigned
    });
    alert("Mission Accepted! You are now the assigned volunteer.");
    setIsAccepting(false);
  };

  const handlePickupUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    triggerHaptic('impactMedium');
    setIsPickingUp(true);
    try { 
        const base64 = await resizeImage(file); 
        onUpdate(posting.id, { 
            status: FoodStatus.PICKUP_VERIFICATION_PENDING, 
            pickupVerificationImageUrl: base64, 
            volunteerId: user.id, 
            volunteerName: user.name || 'Volunteer', 
            volunteerLocation: currentLocation 
        }); 
        triggerHaptic('success');
    } catch { 
        triggerHaptic('error');
        alert("Failed to upload image");
    } finally { 
        e.target.value = ''; // Reset input
        setIsPickingUp(false); 
    }
  };

  const handleVerificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    triggerHaptic('impactMedium');
    setIsVerifying(true);
    try { 
        const base64 = await resizeImage(file); 
        // Always go to VERIFICATION_PENDING so Donor can approve, regardless of who uploaded it (Volunteer or Requester)
        onUpdate(posting.id, { 
            status: FoodStatus.DELIVERY_VERIFICATION_PENDING, 
            verificationImageUrl: base64 
        }); 
        triggerHaptic('success');
    } catch { 
        triggerHaptic('error');
        alert("Failed to upload image");
    } finally { 
        e.target.value = ''; // Reset input
        setIsVerifying(false); 
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    triggerHaptic('impactMedium');
    setIsUploadingReceipt(true);
    try {
        const base64 = await resizeImage(file);
        onUpdate(posting.id, {
            donorReceiptImageUrl: base64
        });
        triggerHaptic('success');
        alert("Handover photo uploaded successfully!");
    } catch {
        triggerHaptic('error');
        alert("Failed to upload photo");
    } finally {
        e.target.value = ''; // Reset input
        setIsUploadingReceipt(false);
    }
  };

  const handleRateClick = () => {
      if (!onRateUser) return;
      triggerHaptic('selection');
      
      let targetId = '';
      let targetName = '';

      if (user.role === UserRole.REQUESTER) {
          // Requester rates Volunteer
          if (posting.volunteerId) {
              targetId = posting.volunteerId;
              targetName = posting.volunteerName || 'Volunteer';
          }
      } else if (user.role === UserRole.DONOR) {
          // Donor rates Volunteer
          if (posting.volunteerId) {
              targetId = posting.volunteerId;
              targetName = posting.volunteerName || 'Volunteer';
          }
      } else if (user.role === UserRole.VOLUNTEER) {
          // Volunteer rates Requester
          if (posting.orphanageId) {
              targetId = posting.orphanageId;
              targetName = posting.orphanageName || 'Requester';
          }
      }

      if (targetId && targetName) {
          onRateUser(posting.id, targetId, targetName, 0, "");
      }
  };

  const handleShare = async () => {
      triggerHaptic('selection');
      const shareData = {
          title: `Food Rescue: ${posting.foodName}`,
          text: `Check out this donation on MEALers Connect: ${posting.foodName} (${posting.quantity}) by ${posting.donorOrg || posting.donorName}.`,
          url: window.location.href
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch (err) {
              console.log('Share dismissed');
          }
      } else {
          // Fallback
          navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
          alert('Donation details copied to clipboard!');
      }
  };

  const handleTTS = async () => {
      if (isPlaying) return;
      triggerHaptic('selection');
      setIsPlaying(true);
      const text = `${isClothes ? 'Clothes' : 'Food'} Donation: ${posting.foodName}. ${posting.description || ''}`;
      
      try {
          const audioData = await generateSpeech(text);
          if (!audioData) throw new Error("No audio data received");

          // Decode Base64
          const binaryString = atob(audioData);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }

          // Create Audio Context (Gemini 2.5 Flash TTS is 24kHz)
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          
          // PCM Decoding (16-bit little-endian)
          const dataInt16 = new Int16Array(bytes.buffer);
          const numChannels = 1;
          const frameCount = dataInt16.length;
          
          const audioBuffer = audioContext.createBuffer(numChannels, frameCount, 24000);
          const channelData = audioBuffer.getChannelData(0);
          
          for (let i = 0; i < frameCount; i++) {
              // Convert int16 to float32 [-1.0, 1.0]
              channelData[i] = dataInt16[i] / 32768.0;
          }

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.onended = () => {
              setIsPlaying(false);
              // Clean up context to free resources
              if (audioContext.state !== 'closed') {
                  audioContext.close();
              }
          };
          source.start();

      } catch (e) {
          console.error("TTS Playback Error:", e);
          setIsPlaying(false);
          alert("Could not play audio. Please try again.");
      }
  };

  const handleLocationInsight = async () => {
      if (locationInsight) { setLocationInsight(null); return; }
      triggerHaptic('selection');
      setIsLoadingInsight(true);
      const query = `Brief summary of location near "${posting.location.line1}, ${posting.location.line2}".`;
      const result = await askWithMaps(query, posting.location.lat && posting.location.lng ? { lat: posting.location.lat, lng: posting.location.lng } : undefined);
      setLocationInsight(result);
      setIsLoadingInsight(false);
  };

  const renderStatus = () => {
      if (posting.status === FoodStatus.AVAILABLE) return isUrgent ? (
          <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(244,63,94,0.4)] border border-rose-400/50 backdrop-blur-md animate-pulse">
              🔥 {t('tag_urgent')}
          </span>
      ) : (
          <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(52,211,153,0.4)] border border-emerald-300/50 backdrop-blur-md">
              ✨ {t('tag_available')}
          </span>
      );
      return <span className="px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest border border-slate-600/50 backdrop-blur-md shadow-lg">{posting.status.replace(/_/g, ' ')}</span>;
  };

  return (
    <>
    <div className={`group bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.3)] hover:-translate-y-3 hover:scale-[1.03] hover:rotate-1 transition-all duration-700 ease-out flex flex-col h-full relative perspective-1000 transform-gpu ${selected ? 'ring-4 ring-emerald-400 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]' : 'border-white/50 dark:border-white/10'}`}>
      
      {/* Selection Overlay for Volunteers */}
      {selectable && onToggleSelect && (
          <div className="absolute top-4 left-4 z-20" onClick={(e) => { e.stopPropagation(); onToggleSelect(posting.id); }}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-emerald-500 border-emerald-500' : 'bg-white/80 border-slate-300 hover:scale-110'}`}>
                  {selected && <svg className="w-5 h-5 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
              </div>
          </div>
      )}

      {/* Expiry Progress */}
      {posting.status === FoodStatus.AVAILABLE && hoursLeft > 0 && <div className="h-1 w-full bg-slate-100"><div className={`h-full ${isUrgent ? 'bg-rose-500' : 'bg-emerald-500'} transition-all duration-1000`} style={{ width: `${progressPercent}%` }}></div></div>}

      {/* Image Area */}
      <div className="h-64 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
        {posting.imageUrl ? <img src={posting.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" alt={posting.foodName} /> : <div className="w-full h-full flex items-center justify-center text-5xl opacity-20 filter grayscale">{isClothes ? '👕' : '🍲'}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="absolute top-4 right-4 flex justify-end items-start z-10">
            <div className="flex flex-col gap-2 items-end transform translate-x-2 group-hover:translate-x-0 transition-transform duration-500 ease-out">
                {renderStatus()}
                {distanceText && <span className="text-[10px] font-black text-slate-900 dark:text-white bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-lg">{distanceText} away</span>}
            </div>
        </div>
        <div className="absolute bottom-5 left-5 right-5 text-slate-900 dark:text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out z-10">
            <div className="mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md text-[9px] font-black uppercase tracking-widest shadow-lg border border-slate-300 dark:border-white/20 ${isClothes ? 'bg-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`}>
                    <span className="text-sm">{isClothes ? '👕' : '🍲'}</span>
                    {isClothes ? 'Apparel' : 'Sustenance'}
                </span>
            </div>
            <h3 className="font-black text-2xl tracking-tight leading-none mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">{posting.foodName}</h3>
            
            <div className="flex items-center gap-2 mt-2">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{posting.donorOrg || posting.donorName}</p>
                {posting.isDonorVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 backdrop-blur-md text-blue-300 text-[9px] font-black uppercase tracking-widest shadow-inner">
                        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                        Verified Check
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-600/90 border border-rose-500/50 backdrop-blur-md text-slate-900 dark:text-white text-[9px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(225,29,72,0.4)] animate-pulse">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Unverified
                    </span>
                )}
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col pt-6 z-20">
          <div className="flex gap-4 mb-6 text-slate-700 dark:text-slate-300">
              <div className="flex-1 p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-center hover:-translate-y-1 transition-transform shadow-sm">
                  <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest leading-none mb-1 text-center w-full">{t('lbl_quantity')}</p>
                  <p className="text-xl font-black tracking-tight">{posting.quantity}</p>
              </div>
              <div className="flex-1 p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-center hover:-translate-y-1 transition-transform shadow-sm">
                  <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest leading-none mb-1 text-center w-full">{t('lbl_expires')}</p>
                  <p className="text-xl font-black tracking-tight">{hoursLeft > 0 ? `${Math.ceil(hoursLeft)}h` : t('lbl_expired')}</p>
              </div>
          </div>

          <div className="flex gap-3 mb-5">
              <button onClick={() => setShowSafetyDetails(!showSafetyDetails)} className={`flex-1 py-3 px-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 shadow-sm ${posting.safetyVerdict?.isSafe ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'}`}>
                  {posting.safetyVerdict?.isSafe ? `🛡️ ${t('card_safe')}` : `⚠️ ${t('card_check')}`}
              </button>
              <button onClick={handleLocationInsight} className="flex-1 py-3 px-3 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 backdrop-blur-md text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm">
                  📍 Area
              </button>
          </div>

          {(showSafetyDetails || locationInsight) && (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 animate-fade-in-up">
                  {showSafetyDetails && <p className="mb-1">"{posting.safetyVerdict?.reasoning}"</p>}
                  {locationInsight && <p className="text-emerald-700">{locationInsight.text}</p>}
                  {isLoadingInsight && <span className="text-emerald-500 animate-pulse">Loading...</span>}
              </div>
          )}

          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium line-clamp-3 mb-6 flex-1 leading-relaxed">{posting.description}</p>

          <div className="mt-auto space-y-3 z-10">
              {/* If REQUESTED, show destination info for volunteer */}
              {user.role === UserRole.VOLUNTEER && posting.status === FoodStatus.REQUESTED && posting.orphanageName && (
                  <div className="mb-4 p-4 bg-blue-500/10 backdrop-blur-md rounded-2xl border border-blue-500/20 flex items-center gap-4 shadow-inner">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-xl shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-400/30">🏠</div>
                      <div>
                          <p className="text-[10px] font-black uppercase text-blue-500 dark:text-blue-400 tracking-widest leading-none mb-1">Destination Address</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{posting.orphanageName}</p>
                      </div>
                  </div>
              )}

              {/* Primary Actions */}
              {/* Volunteer can Accept or Navigate if it is REQUESTED */}
              {user.role === UserRole.VOLUNTEER && posting.status === FoodStatus.REQUESTED && (
                  !posting.volunteerId ? (
                      <div className="flex gap-3">
                          <button onClick={handleAcceptMission} disabled={isAccepting} className="flex-[2] py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-900 dark:text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 group/btn">
                              {isAccepting ? 'Processing...' : 'Accept Mission'} <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                          </button>
                          <button onClick={handleExpressInterest} title="Express Interest" className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-all">
                              Interested?
                          </button>
                      </div>
                  ) : posting.volunteerId === user.id ? (
                      <button 
                          onClick={() => onDirectionsClick?.(posting)} 
                          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-slate-900 dark:text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_10px_20px_-10px_rgba(59,130,246,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group/nav"
                      >
                          <span>🗺️</span> Navigate to Donor <span className="group-hover/nav:translate-x-1 transition-transform">→</span>
                      </button>
                  ) : null
              )}
              
              {user.role === UserRole.REQUESTER && posting.status === FoodStatus.AVAILABLE && (
                  <button onClick={initiateRequest} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-900 dark:text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_10px_20px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_15px_30px_-10px_rgba(59,130,246,0.8)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group/btn">
                      Request Dispatch <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                  </button>
              )}
              
              {/* Cancel Button for Donors - Only if not yet picked up (Available or Requested) */}
              {user.role === UserRole.DONOR && posting.donorId === user.id && (posting.status === FoodStatus.AVAILABLE || posting.status === FoodStatus.REQUESTED) && (
                  <button onClick={() => setShowCancelConfirmation(true)} className="w-full py-4 bg-transparent border border-rose-500/30 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/cancel">
                      <svg className="w-4 h-4 group-hover/cancel:-rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      {t('btn_cancel')}
                  </button>
              )}
              
              {/* Tracking for Requester */}
              {user.role === UserRole.REQUESTER && posting.volunteerId && posting.status !== FoodStatus.DELIVERED && (
                  <button 
                      onClick={() => onTrackClick?.(posting.id)} 
                      className="w-full py-4 bg-white/5 dark:bg-slate-800/50 backdrop-blur-md border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-sm transition-all flex items-center justify-center gap-2 group/track hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  >
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                      </span>
                      {t('btn_track')}
                  </button>
              )}

              {/* Chat Button for Requesters - Active Missions */}
              {user.role === UserRole.REQUESTER && posting.orphanageId === user.id && posting.status !== FoodStatus.AVAILABLE && posting.status !== FoodStatus.DELIVERED && (
                  <button onClick={() => onChatClick?.(posting.id)} className="w-full py-4 bg-white/5 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95">
                      <span className="text-lg">💬</span> {posting.volunteerId ? t('btn_chat_vol') : t('btn_chat_donor')}
                  </button>
              )}
              
              {/* Chat Button for Volunteers - Active Missions */}
              {user.role === UserRole.VOLUNTEER && posting.volunteerId === user.id && posting.status !== FoodStatus.DELIVERED && (
                  <button onClick={() => onChatClick?.(posting.id)} className="w-full py-4 bg-white/5 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95">
                      <span className="text-lg">💬</span> {t('btn_chat')}
                  </button>
              )}

              {/* Chat Button for Donors - Active Missions */}
              {user.role === UserRole.DONOR && posting.donorId === user.id && posting.status !== FoodStatus.AVAILABLE && posting.status !== FoodStatus.DELIVERED && (
                  <button onClick={() => onChatClick?.(posting.id)} className="w-full py-4 bg-white/5 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95">
                      <span className="text-lg">💬</span> {t('btn_chat')}
                  </button>
              )}
              
              {/* Verification Actions - Volunteer Pickup */}
              {user.role === UserRole.VOLUNTEER && (posting.status === FoodStatus.REQUESTED || posting.status === FoodStatus.PICKUP_VERIFICATION_PENDING) && posting.volunteerId === user.id && (
                  <div className="relative">
                      <input type="file" className="hidden" ref={pickupInputRef} onChange={handlePickupUpload} accept="image/*" />
                      <button onClick={() => pickupInputRef.current?.click()} disabled={isPickingUp || posting.status === FoodStatus.PICKUP_VERIFICATION_PENDING} className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-white shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 ${posting.status === FoodStatus.PICKUP_VERIFICATION_PENDING ? 'bg-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)]'}`}>
                          {isPickingUp ? 'Uploading...' : posting.status === FoodStatus.PICKUP_VERIFICATION_PENDING ? (
                              t('btn_wait_approve')
                          ) : (
                              <><span>📷</span> {t('btn_pickup')}</>
                          )}
                      </button>
                  </div>
              )}

              {/* Verification Actions - Volunteer Delivery */}
              {user.role === UserRole.VOLUNTEER && (posting.status === FoodStatus.IN_TRANSIT || posting.status === FoodStatus.DELIVERY_VERIFICATION_PENDING) && posting.volunteerId === user.id && (
                  <div className="relative">
                      <input type="file" className="hidden" ref={fileInputRef} onChange={handleVerificationUpload} accept="image/*" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={isVerifying || posting.status === FoodStatus.DELIVERY_VERIFICATION_PENDING} className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-white shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 ${posting.status === FoodStatus.DELIVERY_VERIFICATION_PENDING ? 'bg-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_10px_20px_-10px_rgba(59,130,246,0.5)]'}`}>
                          {isVerifying ? 'Uploading...' : posting.status === FoodStatus.DELIVERY_VERIFICATION_PENDING ? t('btn_wait_requester') : (
                              <><span>📸</span> {t('btn_confirm')}</>
                          )}
                      </button>
                  </div>
              )}

              {/* Verification Actions - Requester Receipt */}
              {user.role === UserRole.REQUESTER && (posting.status === FoodStatus.IN_TRANSIT || posting.status === FoodStatus.DELIVERY_VERIFICATION_PENDING) && posting.orphanageId === user.id && (
                  <div className="relative">
                      <input type="file" className="hidden" ref={fileInputRef} onChange={handleVerificationUpload} accept="image/*" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={isVerifying || posting.status === FoodStatus.DELIVERY_VERIFICATION_PENDING} className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-white shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 ${posting.status === FoodStatus.DELIVERY_VERIFICATION_PENDING ? 'bg-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)]'}`}>
                          {isVerifying ? 'Uploading...' : posting.status === FoodStatus.DELIVERY_VERIFICATION_PENDING ? t('btn_wait_approve') : (
                              <><span>📷</span> {t('btn_received')}</>
                          )}
                      </button>
                  </div>
              )}

              {/* DONOR RECEIPT UPLOAD (Available after Pickup confirmed) */}
              {user.role === UserRole.DONOR && (posting.status === FoodStatus.IN_TRANSIT || posting.status === FoodStatus.DELIVERY_VERIFICATION_PENDING || posting.status === FoodStatus.DELIVERED) && posting.donorId === user.id && (
                  <div className="mt-4 p-4 bg-white/5 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 border-dashed backdrop-blur-md">
                      {!posting.donorReceiptImageUrl ? (
                          <div className="relative">
                              <input type="file" className="hidden" ref={receiptInputRef} onChange={handleReceiptUpload} accept="image/*" />
                              <button 
                                  onClick={() => receiptInputRef.current?.click()} 
                                  disabled={isUploadingReceipt}
                                  className="w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-amber-500/30 hover:scale-[1.02] active:scale-95"
                              >
                                  {isUploadingReceipt ? (
                                      <span className="animate-pulse">Uploading...</span>
                                  ) : (
                                      <><span>🧾</span> Upload Handover Photo</>
                                  )}
                              </button>
                              <p className="text-[9px] text-center text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-3">Proof of handover to volunteer</p>
                          </div>
                      ) : (
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                  ✓
                              </div>
                              <div className="flex-1">
                                  <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Handover Proof Saved</p>
                                  <a href={posting.donorReceiptImageUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 underline transition-colors">View Photo</a>
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {/* RATING BUTTON - Shown only when delivered and not rated yet */}
              {posting.status === FoodStatus.DELIVERED && onRateUser && (
                  <div className="mt-3">
                      {myRating ? (
                          <div className="w-full py-4 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-center border border-yellow-500/30 flex items-center justify-center gap-2 backdrop-blur-md">
                              <span className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">★</span> You rated {myRating.rating}/5
                          </div>
                      ) : (
                          // Logic to decide who to rate
                          (user.role === UserRole.REQUESTER && posting.volunteerId) ? (
                              <button onClick={handleRateClick} className="w-full py-4 bg-white/5 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:border-yellow-400/50 hover:bg-yellow-500/10 text-slate-600 dark:text-slate-300 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-sm">
                                  Rate Volunteer
                              </button>
                          ) : (user.role === UserRole.DONOR && posting.volunteerId) ? (
                              <button onClick={handleRateClick} className="w-full py-4 bg-white/5 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:border-yellow-400/50 hover:bg-yellow-500/10 text-slate-600 dark:text-slate-300 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-sm">
                                  Rate Volunteer
                              </button>
                          ) : ((user.role === UserRole.VOLUNTEER) && posting.orphanageId) ? (
                              <button onClick={handleRateClick} className="w-full py-4 bg-white/5 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:border-yellow-400/50 hover:bg-yellow-500/10 text-slate-600 dark:text-slate-300 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-sm">
                                  Rate Requester
                              </button>
                          ) : null
                      )}
                  </div>
              )}
          </div>
      </div>
      
      {/* Top Action Buttons (TTS & Share) */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button onClick={handleShare} className="p-2 rounded-full backdrop-blur-md transition-all bg-black/20 text-slate-900 dark:text-white hover:bg-white hover:text-slate-900 shadow-sm opacity-0 group-hover:opacity-100" title="Share Donation">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
          <button onClick={handleTTS} className={`p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${isPlaying ? 'bg-white text-emerald-600' : 'bg-black/20 text-slate-900 dark:text-white hover:bg-white hover:text-slate-900 opacity-0 group-hover:opacity-100'}`} title="Listen">
              {isPlaying ? (
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
              ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              )}
          </button>
      </div>

      {onClose && <button onClick={onClose} className="absolute bottom-4 right-4 z-20 bg-white shadow-lg text-slate-800 p-2 rounded-full hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>}
    </div>

    {showCancelConfirmation && createPortal(
        <div className="fixed inset-0 z-[1000] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in-up">
                <h3 className="text-xl font-black text-slate-800 mb-2">Cancel Donation?</h3>
                <p className="text-slate-500 text-sm mb-6">This cannot be undone. Are you sure you want to retract this posting?</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowCancelConfirmation(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-colors">Keep It</button>
                    <button onClick={() => { onDelete && onDelete(posting.id); setShowCancelConfirmation(false); }} className="flex-1 py-3 bg-rose-500 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors">Yes, Cancel</button>
                </div>
            </div>
        </div>, document.body
    )}

    {showAiWarning && createPortal(
        <div className="fixed inset-0 z-[1100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-fade-in-up border border-slate-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 text-3xl shadow-inner">
                        ⚠️
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">AI Verification Warning</h3>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-6">
                        <p className="text-amber-800 text-xs font-bold leading-relaxed">
                            This food donation has been verified <span className="underline decoration-2 decoration-amber-400/50">ONLY by AI algorithms</span> based on images provided by the donor.
                        </p>
                        <p className="text-amber-700/80 text-[10px] font-medium mt-2">
                            No human food inspector has physically checked this item. Please use your own discretion and inspect the food upon receipt.
                        </p>
                    </div>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setShowAiWarning(false)} 
                            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl text-xs uppercase tracking-widest transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmRequest} 
                            className="flex-1 py-4 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )}
    </>
  );
};

export default FoodCard;
