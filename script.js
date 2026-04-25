const { useState, useEffect, useCallback } = React;

// ★ ここにご自身のAPIキーを入力してください
const apiKey = ""; 

const App = () => {
    const [artQuery, setArtQuery] = useState('');
    const [language, setLanguage] = useState('JP');
    const [isLoading, setIsLoading] = useState(false);
    const [thoughts, setThoughts] = useState([]);
    const [scrollY, setScrollY] = useState(0);
    const [isExpanding, setIsExpanding] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    // Gemini API 呼び出し
    const callGemini = async (prompt, systemInstruction = "") => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] }
        };

        for (let i = 0; i < 5; i++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                const result = await response.json();
                return result.candidates?.[0]?.content?.parts?.[0]?.text;
            } catch (e) {
                if (i === 4) return null;
                await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
            }
        }
        return null;
    };

    const expandWithAI = async () => {
        if (!artQuery || isExpanding) return;
        setIsExpanding(true);
        const systemPrompt = language === 'JP' 
            ? "あなたは宇宙の詩人です。ユーザーの短い言葉を、叙事詩的で美しい、1文の短い詩に拡張してください。必ず10〜30文字程度に収めてください。"
            : "You are a cosmic poet. Expand the user's input into a poetic, beautiful single sentence (15 words max).";
        const expandedText = await callGemini(artQuery, systemPrompt);
        if (expandedText) setArtQuery(expandedText.trim().replace(/^"|"$/g, ''));
        setIsExpanding(false);
    };

    const getStarAttributes = useCallback((index) => {
        const isMobile = windowWidth < 768;
        const gridCols = isMobile ? 1 : 3;
        const col = index % gridCols;
        const row = Math.floor(index / gridCols);
        
        const baseX = isMobile ? 10 : (col * 30) + 15;
        const baseY = (row * (isMobile ? 40 : 60)) + 80;
        
        const jitterX = (Math.sin(index * 123.45) * (isMobile ? 5 : 10)); 
        const jitterY = (Math.cos(index * 543.21) * 15);

        const seed = index * 777;
        const prefixes = ["STAY", "ENDURANCE", "TARS", "GARGANTUA", "EVENT", "HORIZON", "COOPER", "YAMATO", "KAGUYA"];
        const suffixes = ["VOID", "GRAVITY", "ECHO", "SIGNAL", "WAVE", "SINGULARITY", "PULSE"];
        
        return {
            starName: `${prefixes[seed % prefixes.length]} // ${suffixes[(seed >> 2) % suffixes.length]}-${(seed % 99)}`,
            x: baseX + jitterX,
            y: baseY + jitterY,
            speed: (seed % 6 + 3) * (isMobile ? 0.03 : 0.05),
            delay: (seed % 20) * -1
        };
    }, [windowWidth]);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        const handleResize = () => setWindowWidth(window.innerWidth);
        
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize);
        
        const initialThoughts = [
            { id: '1', text: "星の海に溶ける想い", lang: 'JP', lore: "Gravity dilates time near this emotional singularity." },
            { id: '2', text: "Echoes of the eternal void", lang: 'EN', lore: "Subatomic particles vibrate in synchronicity here." },
            { id: '3', text: "光の速さで忘れていく", lang: 'JP', lore: "Information escapes at C, yet memory remains." }
        ].map((item, i) => ({ ...item, ...getStarAttributes(i) }));
        setThoughts(initialThoughts);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, [getStarAttributes]);

    const handleSend = async () => {
        if (!artQuery || isLoading) return;
        setIsLoading(true);
        
        const lorePrompt = `Create a short, scientific, and mysterious one-sentence observation for a star inspired by: "${artQuery}". Use ${language === 'JP' ? 'Japanese' : 'English'}.`;
        const starLore = await callGemini(lorePrompt) || "";

        const nextIndex = thoughts.length;
        const newStar = {
            id: Date.now().toString(),
            text: artQuery,
            lang: language,
            lore: starLore.trim().replace(/^"|"$/g, ''),
            ...getStarAttributes(nextIndex)
        };

        setThoughts(prev => [newStar, ...prev]);
        setArtQuery('');
        setIsLoading(false);
    };

    return (
        <div className="relative min-h-[800vh] bg-[#020205]">
            {/* 背景 */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center scale-110 opacity-30 mix-blend-screen"
                    style={{ 
                        backgroundImage: 'url("https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2000&q=80")',
                        transform: `translateY(${scrollY * 0.08}px)` 
                    }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[60vh] bg-orange-600/[0.05] blur-[120px]" />
            </div>

            {/* ナビゲーション HUD */}
            <nav className="fixed top-0 w-full z-50 p-5 md:p-10 flex justify-between items-center mix-blend-difference">
                <div className="text-[8px] md:text-[10px] font-thin tracking-[0.8em] md:tracking-[1.2em] uppercase opacity-60">Horizon // Deep Space</div>
                <div className="text-[8px] md:text-[10px] font-bold tracking-[0.3em] md:tracking-[0.5em] uppercase text-orange-400/80">
                    {Math.floor(scrollY)} LY
                </div>
            </nav>

            <div className="relative z-10">
                {/* 星（Thought）のレイヤー */}
                <div className="absolute inset-0 pointer-events-none">
                    {thoughts.map((item) => (
                        <div 
                            key={item.id}
                            className="absolute animate-slow-drift"
                            style={{ 
                                top: `${item.y}vh`, 
                                left: `${item.x}%`,
                                transform: `translateY(${-(scrollY * item.speed)}px)`,
                                animationDelay: `${item.delay}s`,
                                width: windowWidth < 768 ? '80%' : 'auto'
                            }}
                        >
                            <div className="relative group pointer-events-auto">
                                <div className="absolute -top-10 left-0 w-px h-10 bg-gradient-to-b from-transparent to-orange-500/30"></div>
                                <div className="pl-4 md:pl-6 border-l-2 border-white/10 py-4 md:py-5 bg-black/50 backdrop-blur-xl rounded-r-2xl hover:border-orange-500 hover:bg-white/[0.05] shadow-2xl transition-all duration-500">
                                    <div className="text-[6px] md:text-[7px] text-orange-400/70 font-mono tracking-[0.3em] uppercase mb-2">
                                        {item.starName}
                                    </div>
                                    <p className="text-[16px] md:text-[22px] font-light text-white tracking-wide leading-relaxed max-w-[280px] md:max-w-[320px]">
                                        {item.text}
                                    </p>
                                    {item.lore && (
                                        <div className="mt-3 max-h-0 overflow-hidden group-hover:max-h-32 transition-all duration-700 border-t border-white/5">
                                            <p className="text-[9px] md:text-[10px] text-white/40 italic pt-3 font-thin">
                                                {item.lore}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <main className="px-6 max-w-5xl mx-auto flex flex-col items-center">
                    <div className="h-screen flex flex-col justify-center items-center text-center">
                        <h1 className="text-4xl md:text-9xl font-thin tracking-[0.4em] md:tracking-[0.6em] uppercase mb-8 drop-shadow-2xl">
                            Stellar<br/>Whispers.
                        </h1>
                        <div className="h-px w-16 md:w-24 bg-white/20 mb-8 md:mb-12"></div>
                        <p className="text-[8px] md:text-[10px] tracking-[1em] uppercase opacity-30 font-bold">Signal from the deep</p>
                    </div>

                    <section className="w-full max-w-xl mb-[400vh]">
                        <div className="bg-black/80 backdrop-blur-3xl p-8 md:p-20 border border-white/10 shadow-2xl rounded-lg">
                            <div className="flex justify-center gap-6 md:gap-8 mb-10 md:mb-16">
                                {['JP', 'EN'].map(ln => (
                                    <button 
                                        key={ln}
                                        onClick={() => setLanguage(ln)}
                                        className={`text-[9px] md:text-[10px] tracking-[0.3em] md:tracking-[0.5em] px-4 py-2 transition-all ${language === ln ? 'text-orange-400 border-b-2 border-orange-400 font-bold' : 'text-white/20'}`}
                                    >{ln === 'JP' ? '日本語' : 'ENGLISH'}</button>
                                ))}
                            </div>
                            <div className="space-y-10">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={artQuery}
                                        onChange={(e) => setArtQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder={language === 'JP' ? "銀河へ言葉を綴る..." : "SIGNAL..."}
                                        className="w-full bg-transparent border-b border-white/20 py-4 md:py-6 text-lg md:text-xl outline-none focus:border-orange-500/60 text-center tracking-[0.1em] font-extralight"
                                    />
                                    <button 
                                        onClick={expandWithAI} 
                                        className="absolute right-0 bottom-4 text-lg opacity-40 hover:opacity-100"
                                    >
                                        {isExpanding ? "..." : "✨"}
                                    </button>
                                </div>
                                <button 
                                    onClick={handleSend}
                                    disabled={isLoading || !artQuery}
                                    className="w-full py-5 md:py-6 border border-white/10 bg-white/5 active:bg-white/20 transition-all text-[9px] md:text-[10px] tracking-[1em] font-black"
                                >
                                    {isLoading ? "SYNCING..." : (language === 'JP' ? "星として放つ" : "LAUNCH STAR")}
                                </button>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
