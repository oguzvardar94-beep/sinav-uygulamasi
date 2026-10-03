"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const data = {
  "Fen Bilimleri": { "5. Sınıf": ["Gökyüzündeki Komşularımız ve Biz", "Kuvveti Tanıyalım", "Canlıların Yapısına Yolculuk", "Işığın Dünyası", "Maddenin Doğası", "Yaşamımızdaki Elektrik", "Sürdürülebilir Yaşam ve Geri Dönüşüm"], "6. Sınıf": ["Güneş Sistemi ve Tutulmalar", "Kuvvetin Etkisinde Hareket", "Canlılarda Sistemler", "Işığın Yansıması ve Renkler", "Maddenin Ayırt Edici Özellikleri", "Elektriğin İletimi ve Direnç", "Sürdürülebilir Yaşam ve Etkileşim"], "7. Sınıf": ["Uzay Çağı", "Kuvvet ve Enerjiyi Keşfedelim", "Vücudumuzdaki Sistemler", "Işığın Kırılması ve Mercekler", "Maddenin Doğasına Yolculuk", "Elektriklenme", "Sürdürülebilir Yaşam ve Enerji"], "8. Sınıf": ["Mevsimler ve İklim", "Yaşamı Kolaylaştıran Kuvvet", "Yaşamın Gizemi", "Sesin Dünyası", "Periyodik Tablo ve Maddenin Etkileşimi", "Elektriğin Yolculuğu", "Sürdürülebilir Yaşam ve Madde Döngüleri"] },
  Matematik: { "5. Sınıf": ["Geometrik Şekiller", "Sayılar ve Nicelikler (1)", "Geometrik Nicelikler", "Sayılar ve Nicelikler (2)", "İstatistiksel Araştırma Süreci", "İşlemlerle Cebirsel Düşünme", "Veriden Olasılığa"], "6. Sınıf": ["Sayılar ve Nicelikler (1)", "Veriden Olasılığa", "Sayılar ve Nicelikler (2)", "İstatistiksel Araştırma Süreci", "Geometrik Şekiller", "İşlemlerle Cebirsel Düşünme", "Geometrik Nicelikler"], "7. Sınıf": ["Sayılar ve Nicelikler (1)", "Geometrik Nicelikler (1)", "İstatistiksel Araştırma Süreci", "Dönüşüm", "Geometrik Şekiller", "Sayılar ve Nicelikler (2)", "Veriden Olasılığa", "İşlemlerle Cebirsel Düşünme", "Geometrik Nicelikler (2)"], "8. Sınıf": ["Sayılar ve Nicelikler", "Geometrik Şekiller", "Veriden Olasılığa", "Cebirsel Düşünme ve Değişimler", "Geometrik Nicelikler", "İstatistiksel Araştırma Süreci", "Dönüşüm"] },
  Türkçe: { "5. Sınıf": ["Oyun Dünyası", "Atatürk’ü Tanımak", "Duygularımı Tanıyorum", "Geleneklerimiz", "İletişim ve Sosyal İlişkiler", "Sağlıklı Yaşıyorum"], "6. Sınıf": ["Dilimizin Zenginliği", "Bağımsızlık Yolu", "Farklı Dünyalar", "İletişim ve Sosyal İlişkiler", "Bilim ve Teknoloji", "Lider Ruhlar"], "7. Sınıf": ["Hayat Boyu Gelişim", "Bir Hilal Uğruna", "İletişim ve Sosyal İlişkiler", "Türk Sanatı", "Okuma Kültürü", "Hak ve Sorumluluklar"], "8. Sınıf": ["İletişim ve Sosyal İlişkiler", "Vatan Sevgisi", "Doğa ve İnsan", "Türk Hikâye Geleneği ve Destanları", "Sanat ve Estetik", "Akademik Düşünce Dünyası"] },
  İngilizce: { "5. Sınıf": ["School Life", "Classroom Life", "Personal Life", "Family Life", "Homes & Houses & Neighbourhoods", "Life in the City & the World"], "6. Sınıf": ["School Life", "Classroom Life", "Personal Life", "Family Life", "Homes & Houses & the Neighbourhood", "Life in the City & the World"], "7. Sınıf": ["School Life", "Classroom Life", "Personal Life", "Family Life", "Life in the Neighbourhood & City", "Life in the World", "Life in Nature", "Life in the Universe & Future"], "8. Sınıf": ["School Life & Education", "Classroom Life & Learning", "Personal Life & Well-being", "Family Life & Home", "Life in the Neighbourhood & City", "Life in the World & Culture", "Life in Nature & Global Problems", "Life in the Universe & Future"] }
} as const;
type Subject = keyof typeof data; type Grade = keyof typeof data["Fen Bilimleri"];
type ExamHistoryMeta = {
  id: string;
  createdAt: string;
  grade: string;
  subject: string;
  topics: string[];
  questionCount: number;
  difficulty: string;
  questionType: string;
  schoolName: string;
  examYear: string;
  examTerm: string;
};
type GeneratedExamData = { sorular?: Array<Record<string, unknown>>; questions?: Array<Record<string, unknown>>; _meta?: ExamHistoryMeta; [key: string]: unknown };

export default function Home() {
  const [examYear, setExamYear] = useState("2025-2026"); const [examTerm, setExamTerm] = useState("1. DÖNEM 1. YAZILI"); const [grade, setGrade] = useState<Grade>("7. Sınıf"); const [subject, setSubject] = useState<Subject>("Fen Bilimleri"); const [selectedTopics, setSelectedTopics] = useState<string[]>([data["Fen Bilimleri"]["7. Sınıf"][3]]); const [count, setCount] = useState("10"); const [difficulty, setDifficulty] = useState("Dengeli"); const [questionType, setQuestionType] = useState("Çoktan seçmeli"); const [generated, setGenerated] = useState(false); const [generating, setGenerating] = useState(false); const [examData, setExamData] = useState<GeneratedExamData | null>(null); const [loggedIn, setLoggedIn] = useState(false); const [showLogin, setShowLogin] = useState(false); const [showProfile, setShowProfile] = useState(false); const [teacherName, setTeacherName] = useState("Öğretmen"); const [schoolName, setSchoolName] = useState(""); const [notice, setNotice] = useState(""); const [activePanel, setActivePanel] = useState<"history" | "bank" | null>(null); const [savedExams, setSavedExams] = useState<GeneratedExamData[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoggedIn(localStorage.getItem("sinav_logged_in") === "true");
      setTeacherName(localStorage.getItem("sinav_teacher_name") || "Öğretmen");
      setSchoolName(localStorage.getItem("sinav_school_name") || "");
      const stored = localStorage.getItem("sinav_exams");
      if (stored) {
        try {
          setSavedExams(JSON.parse(stored));
        } catch {
          localStorage.removeItem("sinav_exams");
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const topics = useMemo(() => data[subject][grade], [subject, grade]);
  async function login(email: string, password: string, name: string, school: string, mode: "login" | "signup") { if (!supabase) throw new Error("Supabase ayarları bulunamadı."); const result = mode === "signup" ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name, school_name: school } } }) : await supabase.auth.signInWithPassword({ email, password }); if (result.error) throw result.error; if (mode === "signup" && !result.data.session) throw new Error("Kayıt tamamlandı. E-postanızı doğruladıktan sonra giriş yapın."); localStorage.setItem("sinav_logged_in", "true"); localStorage.setItem("sinav_teacher_name", mode === "signup" ? name : (result.data.user?.user_metadata?.full_name || "Öğretmen")); const resolvedSchool = mode === "signup" ? school : (result.data.user?.user_metadata?.school_name || localStorage.getItem("sinav_school_name") || ""); localStorage.setItem("sinav_school_name", resolvedSchool); setTeacherName(localStorage.getItem("sinav_teacher_name") || "Öğretmen"); setSchoolName(localStorage.getItem("sinav_school_name") || ""); setLoggedIn(true); setShowLogin(false); }
  function saveProfile(name: string, school: string) { localStorage.setItem("sinav_teacher_name", name); localStorage.setItem("sinav_school_name", school); setTeacherName(name); setSchoolName(school); setShowProfile(false); }
  async function logout() { if (supabase) await supabase.auth.signOut(); localStorage.removeItem("sinav_logged_in"); localStorage.removeItem("sinav_teacher_name"); localStorage.removeItem("sinav_school_name"); setLoggedIn(false); setTeacherName("Öğretmen"); setSchoolName(""); setShowProfile(false); }
  function printExam(mode: "student" | "teacher") { const previousTitle = document.title; document.body.dataset.printMode = mode; document.title = " "; window.print(); window.setTimeout(() => { document.title = previousTitle; delete document.body.dataset.printMode; }, 1000); }
  function openSavedExam(exam: GeneratedExamData) {
    const meta = exam._meta;
    const savedSubject = meta?.subject && meta.subject in data ? meta.subject as Subject : subject;
    const savedGrade = meta?.grade && meta.grade in data["Fen Bilimleri"] ? meta.grade as Grade : grade;
    const availableTopics = data[savedSubject][savedGrade] as readonly string[];
    const legacyTopics = Array.isArray(exam.topics) ? exam.topics.filter((topic): topic is string => typeof topic === "string") : [];
    const firstQuestion = (exam.sorular || exam.questions || [])[0];
    const inferredTopic = String(firstQuestion?.konu || firstQuestion?.topic || "");
    const savedTopics = meta?.topics?.length ? meta.topics : legacyTopics.length ? legacyTopics : [inferredTopic];
    const restoredTopics = savedTopics.filter((topic) => availableTopics.includes(topic));
    const questionTotal = (exam.sorular || exam.questions || []).length;

    setSubject(savedSubject);
    setGrade(savedGrade);
    setSelectedTopics(restoredTopics.length ? restoredTopics : [availableTopics[0]]);
    setCount(String(meta?.questionCount || questionTotal || 10));
    setDifficulty(meta?.difficulty || "Dengeli");
    setQuestionType(meta?.questionType || "Çoktan seçmeli");
    setExamYear(meta?.examYear || examYear);
    setExamTerm(meta?.examTerm || examTerm);
    if (meta?.schoolName) setSchoolName(meta.schoolName);
    setExamData(exam);
    setGenerated(true);
    setActivePanel(null);
    setNotice("Kayıtlı sınav açıldı. Öğrenci veya öğretmen PDF’ini yeniden oluşturabilirsiniz.");
  }
  const distribution = useMemo(() => { const total = Number(count); const base = selectedTopics.length ? Math.floor(total / selectedTopics.length) : 0; const remainder = selectedTopics.length ? total % selectedTopics.length : 0; return selectedTopics.map((topic, index) => ({ topic, count: base + (index < remainder ? 1 : 0) })); }, [count, selectedTopics]);
  async function generateExam() {
    if (!selectedTopics.length) return;
    setGenerating(true);
    setGenerated(false);
    setNotice("");
    try {
      const response = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, subject, topics: selectedTopics, questionCount: Number(count), difficulty, questionType, distribution }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Sınav oluşturulamadı.");
      const result: GeneratedExamData = payload.exam;
      const historyEntry: GeneratedExamData = {
        ...result,
        _meta: {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          grade,
          subject,
          topics: [...selectedTopics],
          questionCount: Number(count),
          difficulty,
          questionType,
          schoolName,
          examYear,
          examTerm,
        },
      };
      setExamData(result);
      const nextExams = [historyEntry, ...savedExams].slice(0, 20);
      setSavedExams(nextExams);
      localStorage.setItem("sinav_exams", JSON.stringify(nextExams));
      setGenerated(true);
      setNotice(subject === "Matematik" ? "Sorular üretildi ve matematiksel kalite kontrolünden geçirildi." : "Sınav başarıyla oluşturuldu.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sınav oluşturulamadı.");
    } finally {
      setGenerating(false);
    }
  }
  const changeGrade = (v: Grade) => { setGrade(v); setSelectedTopics([data[subject][v][0]]); setGenerated(false); };
  const changeSubject = (v: Subject) => { setSubject(v); setSelectedTopics([data[v][grade][0]]); setGenerated(false); };
  if (!loggedIn) return <main className="min-h-screen bg-[#f4f7fb]"><div className="grid min-h-screen place-items-center p-6"><div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#163b68] text-2xl text-white">✦</div><h1 className="text-2xl font-bold text-[#14213d]">Sınav Atölyesi</h1><p className="mt-2 text-sm leading-6 text-[#64748b]">Sınav hazırlama alanını kullanmak için öğretmen hesabınızla giriş yapın.</p><button onClick={() => setShowLogin(true)} className="mt-6 w-full rounded-2xl bg-[#163b68] px-5 py-4 text-sm font-bold text-white">Giriş yap / Kayıt ol</button></div></div>{activePanel && <DataPanel type={activePanel} exams={savedExams} onOpenExam={openSavedExam} onClose={() => setActivePanel(null)} />}{showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={login} />}</main>;
  return <main className="min-h-screen bg-[#f4f7fb] text-[#14213d]
  "><header className="border-b border-[#dfe6ef] bg-white"><div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 lg:px-10"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#163b68] text-xl text-white">✦</div><div><p className="text-lg font-bold">Sınav Atölyesi</p><p className="text-xs text-[#64748b]">Ortaokul sınav hazırlama</p></div></div><nav className="hidden gap-8 text-sm font-medium text-[#53647c] md:flex"><span className="text-[#163b68]">Yeni sınav</span><button onClick={() => setActivePanel("history")}>Sınavlarım</button><button onClick={() => setActivePanel("bank")}>Soru bankası</button></nav><button onClick={() => loggedIn ? setShowProfile(true) : setShowLogin(true)} className="rounded-xl border border-[#d7e0ea] px-4 py-2 text-sm font-semibold text-[#53647c]">{loggedIn ? teacherName : "Giriş yap"}</button></div></header><div className="mx-auto grid max-w-[1400px] gap-7 px-6 py-8 lg:grid-cols-[360px_1fr] lg:px-10"><section className="rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(32,55,85,0.07)]"><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#2d76a8]">Yeni sınav</p><h1 className="text-2xl font-bold">Sınavını tasarla</h1><p className="mt-2 text-sm leading-6 text-[#64748b]">Müfredatına uygun sorular için temel ayarları seç.</p><div className="mt-7 space-y-5"><Field label="Sınıf düzeyi"><select value={grade} onChange={e => changeGrade(e.target.value as Grade)}>{Object.keys(data["Fen Bilimleri"]).map(x => <option key={x}>{x}</option>)}</select></Field><Field label="Ders"><select value={subject} onChange={e => changeSubject(e.target.value as Subject)}>{Object.keys(data).map(x => <option key={x}>{x}</option>)}</select></Field><div><span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">{subject === "Fen Bilimleri" ? "Ünite / konu seçimi" : "Tema / konu seçimi"}</span><div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-[#d7e0ea] p-3">{topics.map(x => <label key={x} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm hover:bg-[#f4f7fb]"><input type="checkbox" checked={selectedTopics.includes(x)} onChange={() => setSelectedTopics(selectedTopics.includes(x) ? selectedTopics.filter(t => t !== x) : [...selectedTopics, x])} className="mt-0.5 h-4 w-4 accent-[#163b68]" /><span>{x}</span></label>)}</div><p className="mt-2 text-xs text-[#718096]">{selectedTopics.length} konu seçildi. Sorular seçilen konulara dağıtılacak.</p>{selectedTopics.length > 0 && <div className="mt-3 rounded-xl bg-[#f7fafc] p-3"><p className="mb-2 text-xs font-bold text-[#53647c]">Önerilen soru dağılımı</p>{distribution.map(item => <div key={item.topic} className="flex justify-between gap-3 py-1 text-xs text-[#64748b]"><span className="truncate">{item.topic}</span><b className="text-[#163b68]">{item.count} soru</b></div>)}</div>}</div><div className="grid grid-cols-2 gap-3"><Field label="Soru sayısı"><select value={count} onChange={e => setCount(e.target.value)}>{[5, 10, 15, 20, 25, 30].map(x => <option key={x}>{x}</option>)}</select></Field><Field label="Zorluk"><select value={difficulty} onChange={e => setDifficulty(e.target.value)}><option>Kolay</option><option>Dengeli</option><option>Zor</option></select></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Eğitim-öğretim yılı"><input value={examYear} onChange={e => setExamYear(e.target.value)} placeholder="2025-2026" /></Field><Field label="Dönem / sınav"><input value={examTerm} onChange={e => setExamTerm(e.target.value)} placeholder="1. DÖNEM 1. YAZILI" /></Field></div><Field label="Soru türü"><select value={questionType} onChange={e => setQuestionType(e.target.value)}><option>Çoktan seçmeli</option><option>Açık uçlu</option><option>Doğru / yanlış</option><option>Kısa cevap</option></select></Field><div className="rounded-2xl bg-[#eef6fb] p-4 text-sm text-[#1c527a]"><b>✧ Akıllı soru dağılımı</b><p className="mt-1 text-xs leading-5 text-[#52708a]">Sorular; sınıf, konu ve zorluk seviyesine göre dengelenecek.</p></div><button onClick={generateExam} disabled={!selectedTopics.length || generating} className="w-full rounded-2xl bg-[#163b68] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-[#163b68]/20 hover:bg-[#0f2c50] disabled:cursor-not-allowed disabled:opacity-50">{generating ? "Sorular hazırlanıyor..." : generated ? "Sınavı yeniden üret" : "Soru üret"}<span className="ml-2">→</span></button></div></section><section><div className="mb-5 flex items-end justify-between"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#2d76a8]">Önizleme</p><h2 className="text-3xl font-bold">Sınav çalışma alanı</h2></div><span className="rounded-full bg-[#e4f4ea] px-3 py-1.5 text-xs font-bold text-[#267348]">Taslak</span></div><div className="rounded-3xl border border-[#dfe6ef] bg-white p-6 shadow-[0_12px_40px_rgba(32,55,85,0.07)] lg:p-8"><div className="flex justify-between gap-5 border-b border-[#e7edf3] pb-7"><div><p className="text-sm font-semibold text-[#2d76a8]">{grade} · {subject}</p><h3 className="mt-2 text-2xl font-bold">{selectedTopics.length ? selectedTopics.join(" · ") : "Konu seçilmedi"}</h3><p className="mt-2 text-sm text-[#64748b]">{count} soru · {difficulty} seviye · Cevap anahtarı dahil</p></div><div className="text-3xl">📄</div></div>{generated ? <Exam data={examData} topics={selectedTopics} grade={grade} subject={subject} count={count} questionType={questionType} schoolName={schoolName} examYear={examYear} examTerm={examTerm} onPrint={printExam} /> : <div className="grid min-h-[390px] place-items-center py-12 text-center"><div><div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-[#eef6fb] text-3xl">✎</div><h4 className="text-lg font-bold">Sınavın burada görünecek</h4><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#718096]">Seçimlerini yap ve “Soru üret” butonuna bas.</p></div></div>}<div className="mt-5 min-h-6 text-center text-sm font-semibold text-[#2d76a8]">{notice}</div></div></section></div>{generating && <GenerationGame />}{activePanel && <DataPanel type={activePanel} exams={savedExams} onOpenExam={openSavedExam} onClose={() => setActivePanel(null)} />}{showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={login} />}{showProfile && <ProfileModal name={teacherName} school={schoolName} onClose={() => setShowProfile(false)} onSave={saveProfile} onLogout={logout} />}</main>;
}
function GenerationGame() {
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [target, setTarget] = useState({ x: 50, y: 50 });

  const moveTarget = () => {
    setTarget({
      x: 9 + Math.random() * 82,
      y: 14 + Math.random() * 72,
    });
  };

  useEffect(() => {
    const clock = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    const mover = window.setInterval(moveTarget, 850);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(mover);
    };
  }, []);

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0f2745]/75 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2d76a8]">Sınav hazırlanıyor</p><h2 className="mt-2 text-2xl font-bold text-[#14213d]">Yıldızı yakala!</h2><p className="mt-2 text-sm leading-6 text-[#64748b]">Sorular hazırlanırken hareket eden yıldıza olabildiğince çok tıkla.</p></div><div className="rounded-2xl bg-[#eef6fb] px-4 py-3 text-center"><b className="block text-2xl text-[#163b68]">{score}</b><span className="text-xs font-semibold text-[#64748b]">puan</span></div></div><div className="relative mt-6 h-72 overflow-hidden rounded-2xl border-2 border-[#dce8f1] bg-[radial-gradient(circle_at_top,_#eef8ff,_#f8fbfd_55%,_#eef3f7)]"><div className="absolute inset-x-0 top-4 text-center text-xs font-semibold text-[#7890a5]">Geçen süre: {seconds} sn</div><button type="button" aria-label="Yıldızı yakala" onClick={() => { setScore((value) => value + 1); moveTarget(); }} className="absolute grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#f4b942] text-2xl text-white shadow-lg shadow-[#f4b942]/30 transition-all duration-200 hover:scale-110 active:scale-90" style={{ left: `${target.x}%`, top: `${target.y}%` }}>★</button></div><div className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-[#53647c]"><span className="h-2 w-2 animate-bounce rounded-full bg-[#2d76a8] [animation-delay:-.3s]"/><span className="h-2 w-2 animate-bounce rounded-full bg-[#2d76a8] [animation-delay:-.15s]"/><span className="h-2 w-2 animate-bounce rounded-full bg-[#2d76a8]"/><span className="ml-2">Kalite kontrolü devam ediyor...</span></div></div></div>;
}
function DataPanel({ type, exams, onOpenExam, onClose }: { type: "history" | "bank"; exams: GeneratedExamData[]; onOpenExam: (exam: GeneratedExamData) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const questions = exams.flatMap(exam => (exam.sorular || exam.questions || []));
  return <div className="fixed inset-0 z-40 bg-[#14213d]/40 p-4 sm:p-10"><div className="mx-auto max-h-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><p className="text-sm font-semibold text-[#2d76a8]">Çalışma alanı</p><h2 className="mt-1 text-2xl font-bold">{type === "history" ? "Sınavlarım" : "Soru Bankası"}</h2><p className="mt-2 text-sm text-[#64748b]">{type === "history" ? `${exams.length} kayıtlı PDF taslağı` : `${questions.length} kayıtlı soru`}</p></div><button onClick={onClose} className="text-2xl text-[#64748b]">×</button></div>{type === "history" ? <div className="space-y-3">{exams.length ? exams.map((exam, i) => { const meta = exam._meta; const date = meta?.createdAt ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(meta.createdAt)) : "Eski kayıt"; return <div key={meta?.id || i} className="rounded-2xl border border-[#e3eaf1] p-4"><button onClick={() => setSelected(selected === i ? null : i)} className="flex w-full items-center justify-between text-left"><div><p className="font-semibold">{String(exam.title || exam.ders || `${meta?.grade || ""} ${meta?.subject || ""} sınavı`).trim()}</p><p className="mt-1 text-xs text-[#64748b]">{String(meta?.questionCount || exam.toplam_soru || exam.questionCount || (exam.sorular || exam.questions || []).length)} soru · {meta?.questionType || "Sınav"} · {date}</p>{meta?.topics?.length ? <p className="mt-1 text-xs text-[#718096]">{meta.topics.join(" · ")}</p> : null}</div><span className="ml-4 text-xs font-bold text-[#2d76a8]">{selected === i ? "Soruları gizle" : "Soruları gör"}</span></button><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => onOpenExam(exam)} className="rounded-xl bg-[#163b68] px-4 py-2 text-xs font-bold text-white">Sınavı aç / PDF oluştur</button></div>{selected === i && <div className="mt-3 rounded-xl bg-[#f7fafc] p-4">{(exam.sorular || exam.questions || []).map((q, qi) => <p key={qi} className="border-b border-[#e3eaf1] py-2 text-sm last:border-0">{qi + 1}. {String(q.soru_metni || q.questionText || q.text || "")}</p>)}</div>}</div>; }) : <p className="rounded-2xl bg-[#f4f7fb] p-5 text-sm text-[#64748b]">Henüz kayıtlı sınav yok. Oluşturduğunuz sınavların PDF’e hazır kopyaları burada saklanacak.</p>}</div> : <div className="space-y-3">{questions.length ? questions.map((q, i) => <div key={i} className="rounded-2xl border border-[#e3eaf1] p-4"><p className="text-xs font-bold text-[#2d76a8]">Soru {i + 1} · {String(q.konu || q.topic || "Genel")}</p><p className="mt-2 text-sm font-semibold">{String(q.soru_metni || q.questionText || q.text || "")}</p></div>) : <p className="rounded-2xl bg-[#f4f7fb] p-5 text-sm text-[#64748b]">Soru bankanız henüz boş. Sınav ürettiğinizde sorular burada görünecek.</p>}</div>}</div></div>;
}
function LoginModal({ onClose, onLogin }: { onClose: () => void; onLogin: (email: string, password: string, name: string, school: string, mode: "login" | "signup") => Promise<void> }) { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [school, setSchool] = useState(""); const [mode, setMode] = useState<"login" | "signup">("login"); const [error, setError] = useState(""); const submit = async () => { try { setError(""); await onLogin(email, password, name, school, mode); } catch (e) { setError(e instanceof Error ? e.message : "Giriş işlemi başarısız oldu."); } }; return <div className="fixed inset-0 z-50 grid place-items-center bg-[#14213d]/40 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><div className="mb-6 flex justify-between"><div><p className="text-sm font-semibold text-[#2d76a8]">Öğretmen hesabı</p><h2 className="mt-1 text-2xl font-bold">{mode === "login" ? "Giriş yap" : "Kayıt ol"}</h2></div><button onClick={onClose} className="text-xl text-[#64748b]">×</button></div><div className="space-y-4">{mode === "signup" && <><Field label="Ad soyad"><input value={name} onChange={e => setName(e.target.value)} placeholder="Örn. Ayşe Yılmaz" /></Field><Field label="Okul adı"><input value={school} onChange={e => setSchool(e.target.value)} placeholder="Örn. Atatürk Ortaokulu" /></Field></>}<Field label="E-posta"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ogretmen@okul.com" /></Field><Field label="Şifre"><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 6 karakter" /></Field>{error && <p className="rounded-xl bg-[#fff1f1] p-3 text-sm text-[#a33a3a]">{error}</p>}<button onClick={submit} disabled={!email || password.length < 6 || (mode === "signup" && (!name || !school))} className="w-full rounded-2xl bg-[#163b68] px-5 py-4 text-sm font-bold text-white disabled:opacity-50">{mode === "login" ? "Giriş yap" : "Hesap oluştur"}</button><button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="w-full text-sm font-semibold text-[#2d76a8]">{mode === "login" ? "İlk kez mi kullanıyorsunuz? Kayıt olun" : "Zaten hesabınız var mı? Giriş yapın"}</button></div></div></div>; }
function ProfileModal({ name, school, onClose, onSave, onLogout }: { name: string; school: string; onClose: () => void; onSave: (name: string, school: string) => void; onLogout: () => Promise<void> }) { const [nextName, setNextName] = useState(name); const [nextSchool, setNextSchool] = useState(school); return <div className="fixed inset-0 z-50 grid place-items-center bg-[#14213d]/40 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><div className="mb-6 flex justify-between"><div><p className="text-sm font-semibold text-[#2d76a8]">Profil</p><h2 className="mt-1 text-2xl font-bold">Öğretmen bilgileri</h2></div><button onClick={onClose} className="text-xl text-[#64748b]">×</button></div><div className="space-y-4"><Field label="Ad soyad"><input value={nextName} onChange={e => setNextName(e.target.value)} /></Field><Field label="Okul adı"><input value={nextSchool} onChange={e => setNextSchool(e.target.value)} /></Field><button onClick={() => onSave(nextName, nextSchool)} className="w-full rounded-2xl bg-[#163b68] px-5 py-4 text-sm font-bold text-white">Profili kaydet</button><button onClick={onLogout} className="w-full rounded-2xl border border-[#efcaca] px-5 py-3 text-sm font-bold text-[#a33a3a]">Çıkış yap</button></div></div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">{label}</span><div className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-[#d7e0ea] [&_input]:px-3.5 [&_input]:py-3 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-[#d7e0ea] [&_select]:bg-white [&_select]:px-3.5 [&_select]:py-3 [&_select]:text-sm [&_select]:font-medium">{children}</div></label>; }
function Diagram({ type, question }: { type: string; question: Record<string, unknown> }) {
  if (type !== "köprü-kamyon") return <div className="my-5 rounded-xl border border-[#d7e0ea] bg-[#f8fbfd] p-3 text-center text-sm text-[#53647c]">Şekil: {type}</div>;
  const bridge = String(question.kopru_yuksekligi || "4³ m"); const truck = String(question.kamyon_yuksekligi || "−3² m");
  return <div className="my-5 rounded-2xl border border-[#d7e0ea] bg-[#f8fbfd] p-3"><svg viewBox="0 0 640 190" className="mx-auto w-full max-w-xl" role="img" aria-label="Köprü ve kamyon yüksekliği şeması"><rect x="80" y="35" width="480" height="25" rx="5" fill="#64748b"/><rect x="115" y="60" width="35" height="95" fill="#94a3b8"/><rect x="490" y="60" width="35" height="95" fill="#94a3b8"/><path d="M150 60 Q320 145 490 60" fill="none" stroke="#cbd5e1" strokeWidth="4"/><rect x="245" y="120" width="150" height="32" rx="5" fill="#2d76a8"/><rect x="270" y="105" width="60" height="17" rx="3" fill="#5b9bc1"/><circle cx="275" cy="153" r="12" fill="#14213d"/><circle cx="365" cy="153" r="12" fill="#14213d"/><text x="540" y="25" fontSize="15" fill="#a33a3a">Köprü: {bridge}</text><text x="410" y="180" fontSize="15" fill="#267348">Kamyon: {truck}</text></svg><p className="text-center text-xs text-[#64748b]">Şekil temsilidir. Yükseklikleri karşılaştırınız.</p></div>;
}
function Exam({ data, topics, grade, subject, count, questionType, schoolName, examYear, examTerm, onPrint }: { data: GeneratedExamData | null; topics: string[]; grade: string; subject: string; count: string; questionType: string; schoolName: string; examYear: string; examTerm: string; onPrint: (mode: "student" | "teacher") => void }) {
  const questions = data?.sorular || data?.questions || [];
  const [points, setPoints] = useState<Record<number, number>>({});
  return <div className="py-7 print-sheet">
    <div className="print-school-header"><p className="school-print-name">{schoolName || "OKUL ADI"}</p><p>{examYear} EĞİTİM-ÖĞRETİM YILI</p><p>{subject.toUpperCase()} · {grade.toUpperCase()} · {examTerm.toUpperCase()} SINAVI</p><table className="print-info-table"><tbody><tr><th>ADI SOYADI</th><th>NUMARASI</th><th>SINIFI</th><th>TARİH</th><th>SÜRE</th><th>PUANI</th></tr><tr><td></td><td></td><td></td><td></td><td>40 DK</td><td></td></tr></tbody></table><p className="print-instruction">Soruları dikkatlice okuyunuz ve cevaplarınızı ilgili alanlara işaretleyiniz.</p></div>
    <div className="mb-6 flex justify-between"><div><p className="school-print-name print:hidden text-sm font-bold">{schoolName || "Okul adı belirtilmedi"}</p><p className="text-sm font-semibold">Üretilen sınav</p><p className="text-xs text-[#64748b]">{questions.length || count} soru · {questionType}</p></div></div>
    {questions.length ? <div className={`space-y-4 print-question-list ${questionType === "Açık uçlu" || questionType === "Kısa cevap" ? "print-open-ended" : "print-multiple-choice"}`}>{questions.map((question, index) => {
      const text = String(question.soru_metni || question.questionText || question.text || "");
      const options = question.secenekler as Record<string, string> | undefined;
      const answer = String(question.dogru_cevap || question.correctAnswer || "");
      const solution = String(question.kisa_cozum || question.solution || "");
      const diagram = String(question.sekil || question.diagram || "yok");
      return <article key={index} className="rounded-2xl border border-[#e3eaf1] p-5"><div className="flex justify-between"><span className="rounded-full bg-[#f2f6fa] px-3 py-1 text-xs font-bold text-[#52708a] print:hidden">Soru {index + 1} · {String(question.zorluk || question.difficulty || "Orta")}</span><span className="text-xs text-[#94a3b8] print:hidden">{String(question.konu || question.topic || topics[0])}</span></div><p className="mt-5 text-base font-semibold leading-7"><b className="mr-2">{index + 1}.</b>{text} <span className="question-points">[{points[index] ?? Math.max(5, Math.round(100 / Math.max(questions.length, 1)))} Puan]</span><input className="point-editor print:hidden" type="number" min="1" max="100" value={points[index] ?? Math.max(5, Math.round(100 / Math.max(questions.length, 1)))} onChange={e => setPoints({ ...points, [index]: Number(e.target.value) })} aria-label={`${index + 1}. soru puanı`} /></p>{(questionType === "Açık uçlu" || questionType === "Kısa cevap") && <div className="answer-lines">{[1,2,3,4].map(line => <div key={line}>................................................................................................</div>)}</div>}{diagram !== "yok" && <Diagram type={diagram} question={question} />}{options && <div className="mt-5 grid gap-2 sm:grid-cols-2">{Object.entries(options).map(([key, value]) => <div key={key} className={`print-option rounded-xl border px-4 py-3 text-sm ${key === answer ? "border-[#9ac5a9] bg-[#eff9f1] text-[#267348]" : "border-[#e5ebf1] text-[#53647c]"}`}><b className="mr-2">{key})</b>{value}</div>)}</div>}{solution && <details className="mt-4 text-sm text-[#53647c]"><summary className="cursor-pointer font-bold text-[#1c527a]">Çözümü göster</summary><p className="mt-2 leading-6">{solution}</p></details>}</article>;
    })}</div> : <div className="rounded-2xl bg-[#fff8e8] p-5 text-sm text-[#795b1a]">Sınav yanıtı alındı ancak soru formatı okunamadı.</div>}
    <div className="print-exam-footer"><b>Her soru eşit puan değerindedir.</b><br/><br/>ZÜMRE ÖĞRETMENLERİ<br/>........................................<br/>........................................</div>    <div className="teacher-answer-key"><h3 className="text-lg font-bold">Cevap Anahtarı</h3>{questions.map((question, index) => <span key={index} className="mr-5 inline-block">{index + 1}. {String(question.dogru_cevap || question.correctAnswer || "")}</span>)}</div>    <div className="mt-6 flex flex-wrap gap-3 print:hidden"><button onClick={() => window.alert("Sınavı düzenlemek için sol paneldeki seçimleri değiştirip yeniden üretin.")} className="rounded-xl bg-[#eef6fb] px-4 py-2.5 text-sm font-bold text-[#1c527a]">Sınavı düzenle</button><button onClick={() => onPrint("student")} className="rounded-xl border border-[#d7e0ea] px-4 py-2.5 text-sm font-bold text-[#53647c]">Öğrenci PDF’i</button><button onClick={() => onPrint("teacher")} className="rounded-xl bg-[#163b68] px-4 py-2.5 text-sm font-bold text-white">Öğretmen PDF’i + cevap anahtarı</button></div>
  </div>;
}
