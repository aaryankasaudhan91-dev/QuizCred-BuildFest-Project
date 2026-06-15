
import React, { useState, useEffect, useRef } from 'react';
import { PredictedHotspot } from '../types';
import { predictSurplusRadar } from '../services/geminiService';
import { storage } from '../services/storageService';
import { triggerHaptic } from '../services/haptics';
import * as L from 'leaflet';
import ScrollReveal from './ScrollReveal';

interface PredictiveRadarViewProps {
    userLocation?: { lat: number; lng: number };
}

const PredictiveRadarView: React.FC<PredictiveRadarViewProps> = ({ userLocation }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [hotspots, setHotspots] = useState<PredictedHotspot[]>([]);
    const [scanProgress, setScanProgress] = useState(0);
    const [selectedHotspot, setSelectedHotspot] = useState<PredictedHotspot | null>(null);
    
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersGroupRef = useRef<L.LayerGroup | null>(null);

    // Initialize Map
    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const initialLat = userLocation?.lat || 20.5937;
            const initialLng = userLocation?.lng || 78.9629;

            const map = L.map(mapContainerRef.current, {
                center: [initialLat, initialLng],
                zoom: 14,
                zoomControl: false,
                attributionControl: false
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            mapInstanceRef.current = map;
            markersGroupRef.current = L.layerGroup().addTo(map);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update Map with Hotspots
    useEffect(() => {
        const map = mapInstanceRef.current;
        const group = markersGroupRef.current;
        if (!map || !group) return;

        group.clearLayers();
        const bounds = L.latLngBounds([]);

        if (userLocation) {
            const userIcon = L.divIcon({
                className: 'user-marker',
                html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative">
                    <div class="absolute -inset-2 bg-blue-400/30 rounded-full animate-ping"></div>
                </div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });
            L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(group);
            bounds.extend([userLocation.lat, userLocation.lng]);
        }

        hotspots.forEach(spot => {
            const color = spot.type === 'RESTAURANT' ? '#f59e0b' : spot.type === 'BAKERY' ? '#10b981' : '#6366f1';
            const iconHtml = `
                <div class="relative group cursor-pointer">
                    <div class="absolute -inset-4 bg-[${color}]/20 rounded-full animate-pulse-slow"></div>
                    <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-white border-2 border-[${color}] shadow-xl transform group-hover:scale-110 transition-transform">
                        ${spot.type === 'RESTAURANT' ? '🍽️' : spot.type === 'BAKERY' ? '🥐' : '🎉'}
                    </div>
                    <div class="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100">
                        <span class="text-[9px] font-black text-[${color}]">${Math.round(spot.probability * 100)}%</span>
                    </div>
                </div>
            `;

            const icon = L.divIcon({
                className: 'predictive-marker',
                html: iconHtml,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            L.marker([spot.location.lat, spot.location.lng], { icon })
                .addTo(group)
                .on('click', () => {
                    setSelectedHotspot(spot);
                    triggerHaptic('selection');
                });

            bounds.extend([spot.location.lat, spot.location.lng]);
        });

        if (bounds.isValid() && hotspots.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [hotspots, userLocation]);

    const handleScan = async () => {
        if (!userLocation) {
            alert("Location access required for Radar scan.");
            return;
        }

        setIsScanning(true);
        setScanProgress(0);
        setHotspots([]);
        setSelectedHotspot(null);
        triggerHaptic('impactHeavy');

        // Animations Steps
        const steps = ["Analyzing Historical Patterns...", "Checking Weather Data...", "Scanning Local Events...", "Synthesizing AI Forecast..."];
        for (let i = 0; i < steps.length; i++) {
            setScanProgress((i + 1) * 25);
            await new Promise(r => setTimeout(r, 600));
        }

        try {
            const history = await storage.getHistoricalPostings();
            const weather = { condition: 'Rainy', temperature: 24 }; // Mocked
            const events = [
                { name: 'Community Summer Fest', type: 'FESTIVAL' },
                { name: 'Tech Conference 2024', type: 'CONFERENCE' }
            ]; // Mocked

            const results = await predictSurplusRadar(userLocation, history, weather, events);
            setHotspots(results);
            triggerHaptic('success');
        } catch (error) {
            console.error("Scan failed", error);
            triggerHaptic('error');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Control Panel */}
            <ScrollReveal className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 text-slate-900 dark:text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-2xl border border-slate-200 dark:border-white/10">🛰️</div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Predictive Radar</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">AI Forecasting System</p>
                        </div>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-300 font-medium text-sm max-w-xl mb-8 leading-relaxed">
                        Our model analyzes regional historical data, real-time weather, and upcoming events to predict which local outlets will have surplus food <span className="text-emerald-400 font-bold">today</span>.
                    </p>

                    <button 
                        onClick={handleScan}
                        disabled={isScanning}
                        className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 group relative overflow-hidden ${isScanning ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-slate-900 dark:text-white hover:bg-emerald-400 active:scale-95'}`}
                    >
                        {isScanning ? (
                            <>
                                <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                                Scanning In Progress... {scanProgress}%
                            </>
                        ) : (
                            <>
                                <span className="text-lg group-hover:rotate-45 transition-transform">✨</span>
                                Scan Area for Surplus
                            </>
                        )}
                        {isScanning && (
                            <div className="absolute bottom-0 left-0 h-1 bg-emerald-400 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                        )}
                    </button>
                </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Map View */}
                <ScrollReveal className="lg:col-span-2 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative bg-slate-100">
                    <div ref={mapContainerRef} className="w-full h-full z-0" />
                    
                    {isScanning && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-slate-900 dark:text-white overflow-hidden">
                            <div className="absolute inset-0 border-[20px] border-emerald-500/5 rounded-full"></div>
                            <div className="radar-scan-line"></div>
                            <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mb-6"></div>
                            <h3 className="text-xl font-black tracking-tight mb-2">Engaging AI Predictors...</h3>
                            <div className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10">Synthesizing Datapoints</div>
                        </div>
                    )}

                    {!isScanning && hotspots.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10 text-center px-8">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center text-4xl mb-6 grayscale opacity-50">🧭</div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Radar Standby</h3>
                            <p className="text-slate-500 text-sm font-medium max-w-xs">Run a scan to see predicted hotspots in your 5km radius.</p>
                        </div>
                    )}
                </ScrollReveal>

                {/* Info / Prediction List */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedHotspot ? (
                        <ScrollReveal animation="fade-right" className="bg-white p-6 rounded-[2.5rem] border-2 border-emerald-500 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => setSelectedHotspot(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">✕</button>
                            </div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl shadow-inner border border-emerald-100">
                                    {selectedHotspot.type === 'RESTAURANT' ? '🍽️' : selectedHotspot.type === 'BAKERY' ? '🥐' : '🎉'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{selectedHotspot.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 bg-emerald-500 text-slate-900 dark:text-white text-[9px] font-black rounded-md uppercase tracking-widest">
                                            {Math.round(selectedHotspot.probability * 100)}% Match
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{selectedHotspot.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-1">AI Reasoning</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{selectedHotspot.reasoning}"</p>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                    <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Proactive Placement</p>
                                    <p className="text-sm font-bold text-slate-800 leading-relaxed">{selectedHotspot.suggestedAction}</p>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Est. Post Time</p>
                                        <p className="text-lg font-black text-slate-900">{selectedHotspot.expectedTime}</p>
                                    </div>
                                    <button 
                                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedHotspot.location.lat},${selectedHotspot.location.lng}`)}
                                        className="h-12 px-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 transition-all"
                                    >
                                        Navigate Now
                                    </button>
                                </div>
                            </div>
                        </ScrollReveal>
                    ) : (
                        hotspots.map((spot, idx) => (
                            <ScrollReveal key={spot.id} delay={idx * 100} animation="fade-right">
                                <button 
                                    onClick={() => { setSelectedHotspot(spot); triggerHaptic('selection'); }}
                                    className="w-full bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-x-2 transition-all group flex items-center gap-4 text-left"
                                >
                                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
                                        {spot.type === 'RESTAURANT' ? '🍽️' : spot.type === 'BAKERY' ? '🥐' : '🎉'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-800 tracking-tight truncate">{spot.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${spot.probability * 100}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-500">{Math.round(spot.probability * 100)}%</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-white dark:bg-slate-900 group-hover:text-slate-900 dark:text-white transition-all transform group-hover:rotate-180">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </button>
                            </ScrollReveal>
                        ))
                    )}
                    
                    {!selectedHotspot && hotspots.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 dark:text-slate-300 opacity-50 p-10 text-center">
                            <div className="text-6xl mb-4 animate-pulse">📡</div>
                            <p className="text-xs font-black uppercase tracking-[0.2em]">Signal Waiting</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes pulse-ring {
                    0% { transform: scale(0.33); opacity: 1; }
                    80%, 100% { opacity: 0; transform: scale(3); }
                }
                .animate-pulse-slow { 
                    animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; 
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .radar-scan-line {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 50%;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5));
                    transform-origin: left center;
                    animation: radar-sweep 4s linear infinite;
                }
                @keyframes radar-sweep {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default PredictiveRadarView;
