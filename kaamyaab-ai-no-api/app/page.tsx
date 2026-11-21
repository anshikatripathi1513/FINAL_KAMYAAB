"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, AudioLines, Award, BookOpen, Brain, CheckCircle2,
  Clock3, Download, Lightbulb, Mic, MicOff, Play, RotateCcw, Sparkles,
  Target, Video, VideoOff, Volume2, Zap
} from "lucide-react";

type Role = "general" | "tech" | "mechanical" | "business";
type Lang = "hi-IN" | "en-IN" | "bn-IN" | "mr-IN" | "ta-IN" | "te-IN" | "gu-IN" | "kn-IN" | "ml-IN" | "pa-IN" | "ur-IN";
type Question = { q: string; keywords: string[]; sample: string };
type ScoreSet = { comm: number[]; role: number[]; prob: number[]; conf: number[] };
type SpeechRecognitionResultLike = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionEventLike = { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

const languages: { value: Lang; label: string }[] = [
  { value: "hi-IN", label: "Hindi / Hinglish (हिंदी)" },
  { value: "en-IN", label: "English" },
  { value: "bn-IN", label: "Bengali (বাংলা)" },
  { value: "mr-IN", label: "Marathi (मराठी)" },
  { value: "ta-IN", label: "Tamil (தமிழ்)" },
  { value: "te-IN", label: "Telugu (తెలుగు)" },
  { value: "gu-IN", label: "Gujarati (ગુજરાતી)" },
  { value: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
  { value: "ml-IN", label: "Malayalam (മലയാളം)" },
  { value: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { value: "ur-IN", label: "Urdu (اردو)" }
];

const questionBank: Record<Role, Record<"hi" | "en", Question[]>> = {
  general: {
    hi: [
      { q: "Apne baare mein bataiye. Aapki education, skills aur career goal kya hain?", keywords: ["education","study","college","skill","project","goal","learn","padhai","course","experience"], sample: "Mera naam [Name] hai. Maine [Course] ki padhai ki hai. Mujhe problem-solving aur teamwork pasand hai. Maine apne academic projects ke through practical skills develop ki hain aur ab ek aise role mein contribute karna chahta/chahti hoon jahan main seekh bhi sakun aur value bhi add kar sakun." },
      { q: "Aapki sabse badi strength kya hai aur aap kis weakness par kaam kar rahe hain?", keywords: ["strength","weakness","improve","practice","learn","adapt","time","communication"], sample: "Meri strength quick learning aur consistency hai. Pehle mujhe public speaking mein hesitation hoti thi, lekin main regular practice aur presentations ke through apni communication improve kar raha/rahi hoon." },
      { q: "Kisi aise challenge ke baare mein bataiye jise aapne mehnat se solve kiya.", keywords: ["challenge","problem","plan","effort","result","solution","team","time"], sample: "Ek project ke dauran deadline kam thi. Maine task ko chhote milestones mein divide kiya, priorities set ki aur team ke saath progress share ki. Isse humne deadline se pehle project complete kar liya." },
      { q: "Aane wale 2–3 saalon mein aap khud ko kahan dekhte hain?", keywords: ["grow","skill","learn","responsible","company","contribute","career","expert"], sample: "Agle 2–3 saalon mein main apne domain mein strong expertise develop karna chahta/chahti hoon, naye challenges lena chahta/chahti hoon aur organization ke goals mein measurable contribution dena chahta/chahti hoon." }
    ],
    en: [
      { q: "Tell me about yourself, your education, key skills, and career goals.", keywords: ["education","skills","project","goal","learn","experience","team","problem"], sample: "I am a motivated graduate with a strong foundation in my field. Through academic projects and regular practice, I have developed problem-solving and communication skills. I am eager to learn, take ownership, and contribute to a collaborative team." },
      { q: "What is your greatest strength and one area you are improving?", keywords: ["strength","weakness","improve","practice","learn","adapt","communication"], sample: "My greatest strength is consistency and quick learning. I am actively improving my public speaking by practicing structured answers and participating in group discussions." },
      { q: "Tell me about a challenge you solved through your own effort.", keywords: ["challenge","problem","plan","effort","result","solution","team","deadline"], sample: "During a project with a tight deadline, I divided the work into milestones, prioritized the critical tasks, and communicated progress with my teammates. We completed the project on time." },
      { q: "Where do you see yourself in the next two to three years?", keywords: ["grow","skills","learn","responsibility","company","contribute","career"], sample: "I see myself strengthening my core skills, taking on greater responsibilities, and contributing measurable value to the organization while continuing to learn." }
    ]
  },
  tech: {
    hi: [
      { q: "Apne kisi technical project ya coding challenge ke baare mein bataiye jo aapne solve kiya ho.", keywords: ["project","problem","code","error","solve","team","data","app","website","logic","test","api"], sample: "Mere project mein database queries slow thi. Maine logs analyze kiye, indexing lagayi aur queries optimize ki, jisse response time improve hua. Is experience se debugging aur testing ka practical knowledge mila." },
      { q: "Agar live app ya website mein achanak bada bug aa jaye, toh aapka pehla step kya hoga?", keywords: ["log","check","error","backup","rollback","debug","team","test","issue","root"], sample: "Sabse pehle main logs aur monitoring check karunga/karungi, impact samjhunga/samjhungi aur zarurat par stable version par rollback karunga/karungi. Phir bug reproduce karke root cause fix aur test karunga/karungi." },
      { q: "Aap nayi programming language ya technology ko jaldi kaise seekhte hain?", keywords: ["practice","project","documentation","video","daily","build","example","notes"], sample: "Main official documentation se fundamentals samajhta/samajhti hoon, small examples try karta/karti hoon aur phir ek mini-project banakar concepts ko practically apply karta/karti hoon." },
      { q: "Humein aapko is IT ya Software role ke liye kyun select karna chahiye?", keywords: ["skill","hardwork","learn","problem","team","dedication","project","ready"], sample: "Mere fundamentals strong hain, main problems ko logically break down karta/karti hoon aur naye tools jaldi seekhta/seekhti hoon. Main ownership lekar team ke saath reliable results deliver kar sakta/sakti hoon." }
    ],
    en: [
      { q: "Tell me about a technical challenge or software project you solved recently.", keywords: ["project","problem","solution","code","built","tested","improved","result","data"], sample: "In a recent project, an API response was slow. I analyzed bottlenecks, optimized database queries, and tested the changes. The response time improved and I documented the solution for the team." },
      { q: "If an application crashes in production, how would you begin troubleshooting?", keywords: ["logs","check","reproduce","isolate","test","fix","monitor","root","cause"], sample: "First, I would check server and error logs, assess user impact, and isolate the failing module. I would reproduce the issue safely, identify the root cause, test a fix, and monitor the deployment." },
      { q: "How do you keep your technical skills updated?", keywords: ["practice","build","courses","documentation","projects","read","coding"], sample: "I read official documentation, follow reliable technical updates, and build small hands-on projects to apply new concepts. I also review my code and learn from feedback." },
      { q: "Why should we hire you for this role?", keywords: ["skills","adaptable","problem","team","passion","value","learn"], sample: "I combine practical fundamentals with a strong learning attitude. I take ownership of tasks, communicate clearly, and collaborate to deliver reliable results." }
    ]
  },
  mechanical: {
    hi: [
      { q: "Ek machine achanak baar-baar ruk rahi hai. Aap troubleshooting kaise shuru karenge?", keywords: ["safety","power","off","check","sensor","motor","manual","inspect","fault","test"], sample: "Sabse pehle safety protocol follow karke machine ko isolate aur lockout karunga/karungi. Phir error indication, power supply, sensors aur mechanical blockage inspect karke authorized procedure ke according repair aur test karunga/karungi." },
      { q: "Workshop ya plant mein kaam karte waqt safety ka dhyan kaise rakhte hain?", keywords: ["ppe","helmet","gloves","rules","check","alert","safety","emergency","clean"], sample: "Main required PPE pehenta/pehenti hoon, machine guards aur emergency stop check karta/karti hoon, aur maintenance se pehle approved isolation procedure follow karta/karti hoon." },
      { q: "Preventive maintenance aur breakdown maintenance mein kya antar hai?", keywords: ["schedule","kharab","baad","regular","check","cost","time","failure"], sample: "Preventive maintenance scheduled checks aur servicing ke through failure hone se pehle kiya jata hai. Breakdown maintenance equipment fail hone ke baad restore karne ke liye hota hai." },
      { q: "Team member ya supervisor se technical disagreement ho toh aap kya karenge?", keywords: ["baat","data","listen","samajh","safety","solution","calm","respect"], sample: "Main pehle unka perspective sununga/sunungi, phir manual, measurements aur safety standards ke basis par apna point rakhunga/rakhungi. Hum milkar safest effective solution choose karenge." }
    ],
    en: [
      { q: "A machine keeps stopping unexpectedly. How would you begin troubleshooting?", keywords: ["safety","power","isolate","inspect","sensor","manual","check","test","root"], sample: "I would first make the equipment safe and isolate the energy source using the approved procedure. Then I would inspect alarms, power connections, sensors, and mechanical jams before testing any repair." },
      { q: "How do you ensure workplace safety during equipment repair?", keywords: ["ppe","lockout","tagout","safety","rules","inspect","hazard"], sample: "I follow the site's safety procedures, use required PPE, isolate hazardous energy where required, keep the work area clear, and verify guards before authorized restart." },
      { q: "What is the importance of preventive maintenance?", keywords: ["downtime","cost","regular","life","efficiency","prevent","failure"], sample: "Preventive maintenance reduces unplanned downtime, improves reliability, extends equipment life, and helps identify issues before they become costly failures." },
      { q: "Describe a time you solved a practical problem under pressure.", keywords: ["problem","calm","step","analyzed","fixed","team","time"], sample: "During a lab activity, equipment did not work as expected. I paused safely, checked the setup step by step, discussed the issue with my team, and tested the corrected setup before continuing." }
    ]
  },
  business: {
    hi: [
      { q: "Kisi angry ya unsatisfied customer ko aap kaise handle karenge?", keywords: ["listen","sununga","sorry","calm","problem","solution","help","follow"], sample: "Main pehle customer ki poori baat dhyan se sununga/sunungi, unki concern acknowledge karunga/karungi, issue clarify karunga/karungi aur realistic timeline ke saath solution provide karke follow-up karunga/karungi." },
      { q: "Apne kisi leadership ya teamwork experience ke baare mein bataiye.", keywords: ["team","event","lead","plan","goal","help","together","success"], sample: "Ek college activity mein maine team ke tasks strengths ke hisaab se divide kiye, short check-ins rakhe aur blockers solve karne mein help ki. Isse humne activity time par complete ki." },
      { q: "Agar aapko ek naya product bechna ho, toh aapki strategy kya hogi?", keywords: ["customer","need","benefit","market","price","demo","trust","value"], sample: "Main target customer ki needs samjhunga/samjhungi, relevant benefits explain karunga/karungi, product demo dunga/dungi aur questions honestly answer karke trust build karunga/karungi." },
      { q: "Pressure aur tight deadlines mein kaam kaise manage karte hain?", keywords: ["priority","list","plan","focus","calm","time","step"], sample: "Main tasks ko urgency aur impact ke basis par prioritize karta/karti hoon, milestones set karta/karti hoon aur progress communicate karta/karti hoon. Agar risk ho toh timely help maangta/maangti hoon." }
    ],
    en: [
      { q: "How would you handle an upset or dissatisfied customer?", keywords: ["listen","empathy","apologize","understand","solution","resolve","calm"], sample: "I would listen without interrupting, acknowledge the customer's concern, clarify the root issue, and offer a practical resolution with a clear timeline. I would follow up to confirm satisfaction." },
      { q: "Tell me about a time you worked effectively in a team.", keywords: ["team","collaborate","goal","communication","role","result","support"], sample: "During a group assignment, we divided responsibilities based on strengths, shared progress regularly, and helped each other resolve blockers. We delivered the work on time." },
      { q: "How do you convince someone to accept your idea?", keywords: ["data","benefits","listen","value","example","clear","needs"], sample: "I first understand their priorities, then explain the value of my idea with relevant facts or examples. I also invite questions and adapt the proposal based on feedback." },
      { q: "How do you prioritize tasks when everything seems urgent?", keywords: ["impact","deadline","urgent","important","schedule","focus","plan"], sample: "I assess each task by impact, deadline, and dependencies. I handle the highest-priority work first, communicate realistic timelines, and revisit priorities when circumstances change." }
    ]
  }
};

const average = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

export default function Home() {
  const [screen, setScreen] = useState<"setup" | "interview" | "report">("setup");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<Lang>("hi-IN");
  const [role, setRole] = useState<Role>("general");
  const [skills, setSkills] = useState("");
  const [answer, setAnswer] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ score: number; text: string; sample: string } | null>(null);
  const [scores, setScores] = useState<ScoreSet>({ comm: [], role: [], prob: [], conf: [] });
  const [elapsed, setElapsed] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [recording, setRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micError, setMicError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recordingRef = useRef(false);
  const answerRef = useRef("");
  const langMode = language === "en-IN" ? "en" : "hi";
  const questions = useMemo(() => questionBank[role][langMode], [role, langMode]);
  const currentQuestion = questions[questionIndex];

  useEffect(() => { answerRef.current = answer; }, [answer]);

  useEffect(() => {
    if (screen !== "interview") return;
    const id = window.setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, [screen]);

  useEffect(() => {
    if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [screen, cameraOn]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    recordingRef.current = false;
    setRecording(false);
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  const cleanup = useCallback(() => {
    stopSpeaking();
    stopCamera();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, [stopCamera, stopSpeaking]);

  useEffect(() => () => {
    cleanup();
  }, [cleanup]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera API available nahi hai. HTTPS ya localhost par app open karein.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setCameraError("");
      setCameraOn(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Camera permission nahi mili. Browser settings mein Camera allow karein.");
      setCameraOn(false);
    }
  };

  const toggleCamera = async () => {
    if (cameraOn) { stopCamera(); return; }
    await startCamera();
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const beginInterview = async () => {
    setQuestionIndex(0);
    setScores({ comm: [], role: [], prob: [], conf: [] });
    setAnswer("");
    setFeedback(null);
    setElapsed(0);
    setScreen("interview");
    await startCamera();
  };

  const toggleMic = () => {
    if (recording) { stopSpeaking(); return; }
    const SpeechCtor = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!SpeechCtor) {
      setSpeechSupported(false);
      setMicError("Is browser mein speech-to-text supported nahi hai. Chrome ya Edge ke latest version mein try karein, ya answer type karein.");
      return;
    }
    window.speechSynthesis?.cancel();
    setMicError("");
    const recognition = new SpeechCtor();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " ";
      }
      if (finalText) setAnswer((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${finalText}`.trimStart());
    };
    recognition.onerror = (event) => {
      setMicError(event.error === "not-allowed" ? "Microphone permission blocked hai. Browser site settings mein Microphone allow karein." : `Mic error: ${event.error}. Aap answer type bhi kar sakte hain.`);
      stopSpeaking();
    };
    recognition.onend = () => {
      if (recordingRef.current) {
        try { recognition.start(); } catch { recordingRef.current = false; setRecording(false); }
      }
    };
    recognitionRef.current = recognition;
    recordingRef.current = true;
    setRecording(true);
    try { recognition.start(); } catch {
      recordingRef.current = false;
      setRecording(false);
      setMicError("Microphone start nahi ho paya. Permission check karke dobara try karein.");
    }
  };

  const analyzeAnswer = () => {
    stopSpeaking();
    window.speechSynthesis?.cancel();
    const raw = answer.trim();
    if (raw.length < 8) {
      setMicError("Pehle apna answer boliye ya kam se kam ek meaningful sentence type karein.");
      return;
    }
    const normalized = raw.toLowerCase();
    const words = normalized.split(/\s+/).filter(Boolean);
    const sentences = raw.split(/[.!?।]+/).filter((s) => s.trim().length > 2).length;
    const uniqueRatio = new Set(words).size / Math.max(words.length, 1);
    const custom = skills.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2);
    const keywords = [...currentQuestion.keywords, ...custom];
    const matched = keywords.filter((word) => normalized.includes(word)).length;
    const comm = Math.min(10, Math.max(3, Math.round(3 + Math.min(words.length, 65) / 13 + (sentences >= 2 ? 1 : 0))));
    const roleScore = Math.min(10, Math.max(3, Math.round(4 + Math.min(matched, 5) * 1.1 + (words.length > 20 ? 1 : 0))));
    const prob = Math.min(10, Math.max(3, Math.round(4 + (sentences >= 2 ? 2 : 0) + (uniqueRatio > .65 ? 1 : 0) + (words.length > 25 ? 1 : 0))));
    const conf = Math.min(10, Math.max(3, Math.round(4 + Math.min(words.length, 40) / 10)));
    setScores((old) => {
      const next = { ...old };
      next.comm[questionIndex] = comm;
      next.role[questionIndex] = roleScore;
      next.prob[questionIndex] = prob;
      next.conf[questionIndex] = conf;
      return next;
    });
    const score = Math.round((comm + roleScore + prob + conf) / 4);
    const tips: string[] = [];
    if (words.length < 18) tips.push("Answer ko thoda detail mein explain karein. Situation → Action → Result (STAR) structure use karein.");
    else tips.push("Achha effort! Aapne answer mein useful detail di hai. Ab ek specific example aur measurable result add karein.");
    if (sentences < 2) tips.push("Jawab ko 2–3 short sentences mein todne se clarity badhegi.");
    else tips.push("Aapka answer structured lag raha hai. Har point ko relevant example se support karein.");
    if (matched < 2) tips.push("Question se directly related skills, steps aur outcome mention karna na bhoolein.");
    setFeedback({ score, text: tips.join(" "), sample: currentQuestion.sample });
    setMicError("");
  };

  const loadNextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((v) => v + 1);
      setAnswer("");
      setFeedback(null);
      setMicError("");
      stopSpeaking();
    } else {
      finishInterview();
    }
  };

  const finishInterview = () => {
    cleanup();
    setScreen("report");
  };

  const retryQuestion = () => { setFeedback(null); setAnswer(""); setMicError(""); };
  const restart = () => {
    cleanup();
    setScreen("setup");
    setAnswer("");
    setFeedback(null);
    setQuestionIndex(0);
    setScores({ comm: [], role: [], prob: [], conf: [] });
    setElapsed(0);
  };

  const comm = average(scores.comm);
  const roleScore = average(scores.role);
  const prob = average(scores.prob);
  const conf = average(scores.conf);
  const overall = Math.round(((comm + roleScore + prob + conf) / 40) * 100);
  const answeredCount = scores.comm.filter((v) => typeof v === "number").length;
  const timeLabel = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Zap size={22} fill="currentColor" /></div>
          <div><div className="brand-name">KaamYaab <span className="gradient-text">AI</span></div><div className="brand-sub">Your confidence. Your language. Your next opportunity.</div></div>
        </div>
        <div className="top-pill">● 11 LANGUAGES · LIVE PRACTICE</div>
      </header>

      <main className="main-wrap">
        {screen === "setup" && <>
          <section className="hero">
            <div className="eyebrow">INTERVIEW PRACTICE, REIMAGINED</div>
            <h1>Interview mein ab <span className="gradient-text">jhijhak nahi.</span></h1>
            <p>Apni comfortable language mein practice karein. Camera ke saamne boliye, answer analyze kijiye aur apni next opportunity ke liye ready baniye.</p>
            <div className="feature-row">
              <span className="feature-chip"><Video size={14}/> Live camera practice</span>
              <span className="feature-chip"><Mic size={14}/> Voice-to-text</span>
              <span className="feature-chip"><AudioLines size={14}/> Spoken questions</span>
              <span className="feature-chip"><Award size={14}/> Instant feedback</span>
            </div>
          </section>

          <section className="panel setup-panel">
            <div className="panel-heading">
              <div className="heading-icon"><Target size={22}/></div>
              <div><h2>Let’s set up your mock interview</h2><p>Bas kuch details bhariye. Aap ready hain!</p></div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">Your name</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ananya Sharma"/>
              </div>
              <div className="field">
                <label htmlFor="language">Practice language</label>
                <select id="language" value={language} onChange={(e) => setLanguage(e.target.value as Lang)}>
                  {languages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <small>Questions and voice recognition use your selected language. Non-English question bank is currently Hindi/Hinglish.</small>
              </div>
              <div className="field">
                <label htmlFor="role">Target role / stream</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="general">Freshers / General HR</option>
                  <option value="tech">Software / IT / Computer Science</option>
                  <option value="mechanical">Core Engineering / Mechanical</option>
                  <option value="business">Sales / Marketing / Business</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="skills">Your key skills (optional)</label>
                <input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. teamwork, Python, communication"/>
                <small>Comma-separated skills help tailor the local feedback.</small>
              </div>
            </div>
            <button className="primary-btn full-btn" onClick={beginInterview}><Play size={17} fill="currentColor"/> Launch my interview <ArrowRight size={17}/></button>
            <p className="note">Privacy: camera preview stays in your browser and is not recorded or uploaded. This version works without an API key; feedback is generated locally using answer structure and keyword checks, not a cloud AI model.</p>
          </section>
        </>}

        {screen === "interview" && <>
          <div className="studio-head">
            <div><div className="eyebrow">YOUR PRACTICE ROOM</div><h2>Mock Interview Studio</h2><p>Take a breath. You’ve got this, {name.trim() || "champion"}.</p></div>
            <div className="timer-pill"><Clock3 size={14} style={{display:"inline",verticalAlign:"-2px",marginRight:6}}/>{timeLabel}</div>
          </div>
          <div className="studio-grid">
            <section className="video-card">
              <div className="video-frame">
                {cameraOn ? <video ref={videoRef} autoPlay muted playsInline /> : <div className="video-placeholder"><div><VideoOff size={34}/><p>Camera preview is off</p><small>Enable camera to practice eye contact</small></div></div>}
                <span className="live-tag">{cameraOn ? "● CAMERA LIVE" : "● CAMERA OFF"}</span>
              </div>
              <div className="video-actions">
                <button className="secondary-btn" onClick={toggleCamera}>{cameraOn ? <VideoOff size={15}/> : <Video size={15}/>} {cameraOn ? "Turn off" : "Turn on"} camera</button>
                <button className="secondary-btn" onClick={() => speak(currentQuestion.q)}><Volume2 size={15}/> Replay question</button>
              </div>
              {cameraError && <p className="tip" role="status">{cameraError}</p>}
              <p className="tip"><Lightbulb size={13} style={{display:"inline",verticalAlign:"-2px",marginRight:5,color:"#fbbf24"}}/>Camera mein dekh kar naturally boliye. Aapka video record ya upload nahi hota.</p>
            </section>

            <section>
              <div className="question-card">
                <div className="question-top"><span>QUESTION {questionIndex + 1} OF {questions.length}</span><span>{languages.find((l) => l.value === language)?.label}</span></div>
                <h3>{currentQuestion.q}</h3>
                <div className="question-actions">
                  <button className="secondary-btn" onClick={() => speak(currentQuestion.q)}><Volume2 size={14}/> Hear question</button>
                  <button className="secondary-btn" onClick={() => window.speechSynthesis?.cancel()}><AudioLines size={14}/> Stop voice</button>
                </div>
              </div>
              <div className="answer-card">
                <div className="answer-top"><strong>Your answer</strong><span className="word-count">{wordCount} words</span></div>
                <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Mic se boliye ya yahan apna answer type kijiye..."/>
                <div className="answer-actions">
                  <button className={recording ? "danger-btn" : "secondary-btn"} onClick={toggleMic}>{recording ? <MicOff size={16}/> : <Mic size={16}/>} {recording ? "Stop speaking" : "Start speaking"}</button>
                  <button className="primary-btn" onClick={analyzeAnswer}><Sparkles size={16}/> Analyze answer</button>
                </div>
                {micError && <p className="tip" role="status">{micError}</p>}
                {!speechSupported && <p className="tip">You can continue by typing your answer.</p>}
              </div>
              {feedback && <div className="feedback-card">
                <div className="feedback-title"><strong><CheckCircle2 size={17} style={{display:"inline",verticalAlign:"-3px",marginRight:6,color:"#6ee7b7"}}/>Instant coaching feedback</strong><span className="score-bubble">Score: {feedback.score}/10</span></div>
                <p>{feedback.text}</p>
                <div className="sample"><strong>Sample answer structure</strong><br/>{feedback.sample}</div>
                <div className="answer-actions">
                  <button className="secondary-btn" onClick={retryQuestion}><RotateCcw size={15}/> Try again</button>
                  <button className="primary-btn" onClick={loadNextQuestion}>{questionIndex === questions.length - 1 ? "Finish & view report" : "Next question"} <ArrowRight size={15}/></button>
                </div>
              </div>}
            </section>
          </div>
          <div className="studio-footer">
            <button className="secondary-btn" onClick={() => { cleanup(); setScreen("setup"); }}><ArrowLeft size={15}/> Exit interview</button>
            <span className="note" style={{margin:0}}>Answered {answeredCount} of {questions.length} questions</span>
          </div>
        </>}

        {screen === "report" && <>
          <section className="panel">
            <div className="report-hero">
              <div className="eyebrow">YOUR PRACTICE SUMMARY</div>
              <div style={{display:"flex",justifyContent:"center",marginTop:14}}><Award size={34} color="#c4b5fd"/></div>
              <h2>Shabaash, {name.trim() || "Champion"}!</h2>
              <p>Your mock interview readiness report is ready.</p>
              <div className="overall" style={{"--score":`${overall}%`} as React.CSSProperties}><strong>{overall}%</strong></div>
              <p style={{marginTop:12,fontSize:12}}>Overall practice score · {answeredCount}/{questions.length} answers evaluated</p>
            </div>
            <div className="metrics-grid">
              <div className="metric"><div className="metric-icon"><AudioLines size={21}/></div><strong>{comm}/10</strong><span>Communication</span><small>Clarity & structure</small></div>
              <div className="metric"><div className="metric-icon"><BookOpen size={21}/></div><strong>{roleScore}/10</strong><span>Role knowledge</span><small>Relevant keywords</small></div>
              <div className="metric"><div className="metric-icon"><Brain size={21}/></div><strong>{prob}/10</strong><span>Problem solving</span><small>Logical explanation</small></div>
              <div className="metric"><div className="metric-icon"><Zap size={21}/></div><strong>{conf}/10</strong><span>Answer fluency</span><small>Answer depth</small></div>
            </div>
            <div className="plan">
              <h3><Target size={18} style={{display:"inline",verticalAlign:"-3px",marginRight:7,color:"#f0abfc"}}/>Your 7-day action plan</h3>
              <div className="plan-grid">
                <div className="plan-item"><strong>Day 1–2 · Answer structure</strong><p>Har answer ko Situation, Action aur Result mein organize karein. 5 common HR questions practice karein.</p></div>
                <div className="plan-item"><strong>Day 3–4 · Role knowledge</strong><p>Apne domain ke 5 core concepts revise karein aur har concept ka simple real-life example taiyar karein. Current score: {roleScore}/10.</p></div>
                <div className="plan-item"><strong>Day 5–6 · Camera confidence</strong><p>Roz 5 minute camera ke saamne practice karein. Pace, eye contact aur clear sentences par focus karein.</p></div>
                <div className="plan-item"><strong>Day 7 · Final mock challenge</strong><p>Ek aur complete mock interview dein. Apne purane answers se compare karke measurable improvement track karein.</p></div>
              </div>
            </div>
            <div className="report-actions">
              <button className="secondary-btn" onClick={() => window.print()}><Download size={16}/> Save / print PDF</button>
              <button className="primary-btn" onClick={restart}><RotateCcw size={16}/> Start new interview</button>
            </div>
          </section>
        </>}
        <div className="footer-note">Made to help every learner speak with confidence · KaamYaab AI</div>
      </main>
    </div>
  );
}
