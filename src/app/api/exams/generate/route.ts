import { NextResponse } from "next/server";
import { getMathCurriculumContext } from "@/lib/math-curriculum";

type RequestBody = {
  grade: string;
  subject: string;
  topics: string[];
  questionCount: number;
  difficulty: string;
  questionType: string;
  distribution: { topic: string; count: number }[];
};

type OpenAIResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

const difficultyDefinitions = {
  Kolay: "Kazanımın temel uygulamasını ölçen, en fazla 1-2 doğrudan işlem veya çıkarım gerektiren soru.",
  Dengeli: "Kolay, orta ve zor soruları yaklaşık %30, %50 ve %20 oranında dağıt.",
  Zor: "Çok adımlı akıl yürütme veya gösterimler arası geçiş gerektiren; zorluğu uzun işlemden değil düşünmeden gelen soru.",
} as const;

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "İstek verisi okunamadı." }, { status: 400 });
  }

  if (!body.grade || !body.subject || !body.topics?.length || !body.questionCount) {
    return NextResponse.json({ error: "Sınıf, ders, konu ve soru sayısı gereklidir." }, { status: 400 });
  }
  if (!Number.isInteger(body.questionCount) || body.questionCount < 1 || body.questionCount > 30) {
    return NextResponse.json({ error: "Soru sayısı 1 ile 30 arasında olmalıdır." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      mode: "demo",
      exam: createDemoExam(body),
      message: "OPENAI_API_KEY tanımlı olmadığı için demo soru döndürüldü."
    });
  }

  const schema = createExamSchema(body.questionCount);
  const curriculumContext = body.subject === "Matematik"
    ? getMathCurriculumContext(body.grade, body.topics)
    : [];
  const prompt = createGenerationPrompt(body, curriculumContext);

  try {
    const draft = await requestStructuredExam(apiKey, prompt, schema, body.subject === "Matematik" ? "medium" : "low");
    const exam = body.subject === "Matematik"
      ? await requestStructuredExam(apiKey, createReviewPrompt(body, draft), schema, "medium")
      : draft;

    return NextResponse.json({ mode: "openai", exam });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Sınav oluşturulamadı.";
    console.error("Exam generation failed", detail);
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}

function createGenerationPrompt(
  body: RequestBody,
  curriculumContext: Array<{ topic: string; scope: string }>,
) {
  const common = `# Görev\n${body.grade} ${body.subject} dersi için özgün bir sınav hazırla.\n\n# Sınav ayarları\n- Konular: ${body.topics.join(", ")}\n- Soru sayısı: ${body.questionCount}\n- Soru türü: ${body.questionType}\n- Zorluk tercihi: ${body.difficulty}\n- Zorluk açıklaması: ${difficultyDefinitions[body.difficulty as keyof typeof difficultyDefinitions] || body.difficulty}\n- Konu dağılımı: ${JSON.stringify(body.distribution)}\n\nHer konu için belirtilen soru sayısına tam olarak uy. Sorular birbirinin yalnızca sayı veya ad değişmiş kopyaları olmasın.`;

  if (body.subject !== "Matematik") {
    return `${common}\n\nTürkiye ortaokul müfredatına ve öğrenci seviyesine uygun, açık, tek anlamlı ve ölçme değeri yüksek sorular üret. Her sorunun cevabını ve kısa çözümünü doğrula.`;
  }

  return `# Rol\nSen Türkiye Yüzyılı Maarif Modeli ve MEB ortaokul matematik programına hâkim, deneyimli bir matematik öğretmeni ve ölçme-değerlendirme uzmanısın.\n\n${common}\n\n# MEB program kapsamı\n${curriculumContext.map((item) => `- ${item.topic}: ${item.scope}`).join("\n") || "Seçilen konu başlıklarının sınıf düzeyindeki MEB kapsamıyla sınırlı kal."}\n\n# Matematik sorusu kalite ölçütleri\n1. Her soru verilen sınıf düzeyine, konuya ve program kapsamına doğrudan uygun olsun.\n2. Tanım ezberi yerine problem çözme, temsil, ilişki kurma, yorumlama veya muhakeme becerisini ölç.\n3. Günlük yaşam bağlamı doğal ve matematiksel olarak gerekli olsun; yapay hikâye ekleme.\n4. Soruda yalnızca gerekli bilgiler bulunsun ve verilen bilgiler çözüm için yeterli olsun.\n5. İşlemleri, sembolleri, birimleri ve doğru cevabı bağımsız olarak kontrol et.\n6. Çoktan seçmeli soruda yalnız bir seçenek doğru olsun. Çeldiricileri yaygın kavram, işlem veya yorum hatalarından üret; "hepsi/hiçbiri" kullanma.\n7. Doğru seçenekleri A, B, C ve D harflerine dengeli dağıt.\n8. Açık uçlu veya kısa cevaplı soruda secenekler alanını null yap.\n9. Zorluk büyük sayılardan ya da uzun işlemlerden değil, gereken düşünme düzeyinden gelsin.\n10. Şekil olmadan çözülemeyen soru üretme. Desteklenen bir şema yeterliyse sekil alanını uygun değerle doldur; aksi hâlde sekil alanı "yok" olsun ve gerekli bilgiyi metinde ver.\n\n# Son kontrol\nHer soruyu sessizce çöz ve denetle: matematiksel doğruluk, tek ve kesin cevap, yeterli veri, kazanıma uygunluk, çeldirici kalitesi ve diğer sorulardan farklılık. Kontrolü geçmeyen soruyu yanıtlamadan önce düzelt veya yeniden yaz. Kontrol sürecini çıktıya ekleme.`;
}

function createReviewPrompt(body: RequestBody, draft: unknown) {
  return `# Rol\nSen kıdemli bir matematik zümre başkanı ve sınav denetçisisin.\n\n# Görev\nAşağıdaki ${body.grade} matematik sınavını denetle ve nihai hâlini üret. Soru sayısını (${body.questionCount}) ve konu dağılımını (${JSON.stringify(body.distribution)}) koru.\n\nHer soruyu gerçekten çözerek şu kusurları gider:\n- yanlış veya seçeneklerde bulunmayan cevap,\n- birden fazla doğru seçenek,\n- eksik/fazla veri ya da birim hatası,\n- sınıf veya MEB kapsamı dışındaki içerik,\n- yüzeysel, ezbere dayalı veya birbirini tekrar eden soru,\n- mantıksız çeldirici, yapay bağlam ve gereksiz uzunluk,\n- soru türüyle uyumsuz seçenek yapısı.\n\nKusurlu soruyu yalnızca açıklama; doğrudan kaliteli ve özgün bir soruyla değiştir. Kısa çözümde sonucu doğrulayan yeterli işlem veya gerekçe bulunsun. Nihai sınav dışında değerlendirme notu yazma.\n\n# Taslak sınav\n${JSON.stringify(draft)}`;
}

async function requestStructuredExam(
  apiKey: string,
  input: string,
  schema: Record<string, unknown>,
  effort: "low" | "medium",
) {
  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4",
      input,
      reasoning: { effort },
      max_output_tokens: 24000,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "middle_school_exam",
          strict: true,
          schema,
        },
      },
    }),
  });

  const rawResult = await aiResponse.text();
  if (!aiResponse.ok) {
    let detail = "OpenAI isteği başarısız oldu.";
    try {
      const parsed = JSON.parse(rawResult);
      detail = parsed?.error?.message || detail;
    } catch {
      // Keep the generic message if the provider did not return JSON.
    }
    throw new Error(detail);
  }

  const result = JSON.parse(rawResult) as OpenAIResponse;
  const outputText = result.output
    ?.filter((item) => item.type === "message")
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text || "")
    .join("");

  if (!outputText) throw new Error("OpenAI geçerli bir sınav yanıtı döndürmedi.");
  return JSON.parse(outputText);
}

function createExamSchema(questionCount: number): Record<string, unknown> {
  const optionsSchema = {
    type: "object",
    properties: {
      A: { type: "string", minLength: 1 },
      B: { type: "string", minLength: 1 },
      C: { type: "string", minLength: 1 },
      D: { type: "string", minLength: 1 },
    },
    required: ["A", "B", "C", "D"],
    additionalProperties: false,
  };

  return {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1 },
      sorular: {
        type: "array",
        minItems: questionCount,
        maxItems: questionCount,
        items: {
          type: "object",
          properties: {
            soru_metni: { type: "string", minLength: 1 },
            secenekler: { anyOf: [optionsSchema, { type: "null" }] },
            dogru_cevap: { type: "string", minLength: 1 },
            kisa_cozum: { type: "string", minLength: 1 },
            konu: { type: "string", minLength: 1 },
            kazanim: { type: "string", minLength: 1 },
            olculen_beceri: { type: "string", minLength: 1 },
            zorluk: { type: "string", enum: ["Kolay", "Orta", "Zor"] },
            sekil: { type: "string", enum: ["yok", "köprü-kamyon", "sayı doğrusu"] },
            kopru_yuksekligi: { type: "string" },
            kamyon_yuksekligi: { type: "string" },
          },
          required: [
            "soru_metni", "secenekler", "dogru_cevap", "kisa_cozum", "konu",
            "kazanim", "olculen_beceri", "zorluk", "sekil", "kopru_yuksekligi",
            "kamyon_yuksekligi",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "sorular"],
    additionalProperties: false,
  };
}

function createDemoExam(body: RequestBody) {
  return { title: `${body.grade} ${body.subject} sınavı`, topics: body.topics, questionCount: body.questionCount, distribution: body.distribution, questions: [{ number: 1, topic: body.topics[0], difficulty: "Orta", text: `${body.topics[0]} konusu ile ilgili aşağıdaki ifadelerden hangisi doğrudur?`, options: ["Konunun temel özelliklerinden biridir.", "Konu ile ilişkili değildir.", "Yalnızca başka bir sınıfta işlenir.", "Yukarıdakilerin hiçbiri."], answer: "A", solution: "Bu demo sorusudur; gerçek API anahtarı eklendiğinde yapay zekâ tarafından üretilecektir." }] };
}
