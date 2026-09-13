import { NextResponse } from "next/server";

type RequestBody = {
  grade: string;
  subject: string;
  topics: string[];
  questionCount: number;
  difficulty: string;
  questionType: string;
  distribution: { topic: string; count: number }[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  if (!body.grade || !body.subject || !body.topics?.length || !body.questionCount) {
    return NextResponse.json({ error: "Sınıf, ders, konu ve soru sayısı gereklidir." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      mode: "demo",
      exam: createDemoExam(body),
      message: "OPENAI_API_KEY tanımlı olmadığı için demo soru döndürüldü."
    });
  }

  const prompt = `Sen Türkiye ortaokul müfredatına uygun sınav hazırlayan bir ölçme-değerlendirme uzmanısın.\n\nSınıf: ${body.grade}\nDers: ${body.subject}\nKonular: ${body.topics.join(", ")}\nSoru sayısı: ${body.questionCount}\nZorluk: ${body.difficulty}\nSoru türü: ${body.questionType}\nDağılım: ${JSON.stringify(body.distribution)}\n\nYalnızca bu konular kapsamında, seçilen dağılıma uyan sorular üret. Her soruda soru metni, seçenekler, doğru cevap, kısa çözüm, konu ve zorluk alanları olsun. Şekil gereken sorularda sekil alanına yalnızca "köprü-kamyon", "sayı doğrusu" veya "yok" yaz. Köprü-kamyon sorularında kopru_yuksekligi ve kamyon_yuksekligi alanlarını da ekle. Sonucu JSON olarak döndür.`;
  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.4", input: prompt, store: false })
  });
  const rawResult = await aiResponse.text();
  if (!aiResponse.ok) {
    let detail = "OpenAI isteği başarısız oldu.";
    try {
      const parsed = JSON.parse(rawResult);
      detail = parsed?.error?.message || detail;
    } catch {
      // Keep a generic message when the provider does not return JSON.
    }
    console.error("OpenAI request failed", aiResponse.status, detail);
    return NextResponse.json({ error: detail, status: aiResponse.status }, { status: 502 });
  }
  const result = JSON.parse(rawResult);
  return NextResponse.json({ mode: "openai", result });
}

function createDemoExam(body: RequestBody) {
  return { title: `${body.grade} ${body.subject} sınavı`, topics: body.topics, questionCount: body.questionCount, distribution: body.distribution, questions: [{ number: 1, topic: body.topics[0], difficulty: "Orta", text: `${body.topics[0]} konusu ile ilgili aşağıdaki ifadelerden hangisi doğrudur?`, options: ["Konunun temel özelliklerinden biridir.", "Konu ile ilişkili değildir.", "Yalnızca başka bir sınıfta işlenir.", "Yukarıdakilerin hiçbiri."], answer: "A", solution: "Bu demo sorusudur; gerçek API anahtarı eklendiğinde yapay zekâ tarafından üretilecektir." }] };
}
