import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export interface ScanAnalysis {
  jawline: string;
  symmetry: string;
  skinQuality: string;
  eyeArea: string;
  noseProfile: string;
  overallStructure: string;
}

export interface RoadmapStep {
  timeframe: string;
  title: string;
  steps: string[];
  priority: "critical" | "high" | "medium";
}

export interface ProductRecommendation {
  name: string;
  category: string;
  reason: string;
  price: string;
  link: string;
  image: string;
}

export interface ScanResult {
  rating: number; // 0–100 internally
  label: string;
  analysis: ScanAnalysis;
  roadmap: RoadmapStep[];
  products: ProductRecommendation[];
}

export function getRatingLabel(rating: number): string {
  if (rating <= 25) return "Sub3";
  if (rating <= 30) return "Sub5";
  if (rating <= 50) return "LTN";
  if (rating <= 75) return "MTN";
  if (rating <= 85) return "HTN";
  if (rating <= 95) return "Chad";
  return "True Adam";
}

export function formatRating(rating: number): string {
  return (rating / 10).toFixed(1);
}

const DEMO_PRODUCTS: Record<string, ProductRecommendation[]> = {
  Sub3: [
    {
      name: "CeraVe Hydrating Cleanser",
      category: "Skincare",
      reason: "Foundation skincare to improve texture and hydration baseline",
      price: "$14.99",
      link: "https://www.amazon.com/dp/B01MSSDEPK",
      image: "/products/cleanser.jpg",
    },
    {
      name: "The Ordinary Niacinamide 10% + Zinc 1%",
      category: "Skincare",
      reason: "Reduces pores, evens skin tone, controls sebum",
      price: "$9.90",
      link: "https://www.amazon.com/dp/B07YF9Q4FJ",
      image: "/products/niacinamide.jpg",
    },
    {
      name: "Jaw Exerciser Set",
      category: "Jawline",
      reason: "Progressive jaw resistance training to define jawline",
      price: "$19.99",
      link: "https://www.amazon.com/dp/B07PY6TD2H",
      image: "/products/jaw.jpg",
    },
  ],
  Sub5: [
    {
      name: "Paula's Choice BHA Exfoliant",
      category: "Skincare",
      reason: "Unclogs pores and smooths skin texture significantly",
      price: "$32.00",
      link: "https://www.amazon.com/dp/B00949CTQQ",
      image: "/products/bha.jpg",
    },
    {
      name: "Mewing Tongue Posture Guide",
      category: "Facial Structure",
      reason: "Correct tongue posture for long-term facial bone development",
      price: "$0",
      link: "https://www.orthotricorrect.com",
      image: "/products/mewing.jpg",
    },
  ],
  LTN: [
    {
      name: "Vitamin C Serum (15%)",
      category: "Skincare",
      reason: "Brightens complexion and fights hyperpigmentation",
      price: "$24.99",
      link: "https://www.amazon.com/dp/B01M4MCUAF",
      image: "/products/vitc.jpg",
    },
    {
      name: "Derma Roller (0.3mm)",
      category: "Skincare",
      reason: "Stimulates collagen for improved skin texture",
      price: "$18.99",
      link: "https://www.amazon.com/dp/B00EB7RK76",
      image: "/products/dermaroller.jpg",
    },
  ],
  MTN: [
    {
      name: "Retinol 0.5% Serum",
      category: "Skincare",
      reason: "Accelerates skin cell turnover and reduces fine lines",
      price: "$29.00",
      link: "https://www.amazon.com/dp/B07FM53Y4P",
      image: "/products/retinol.jpg",
    },
    {
      name: "Sunscreen SPF 50+",
      category: "Skincare",
      reason: "Essential UV protection to preserve skin quality",
      price: "$16.99",
      link: "https://www.amazon.com/dp/B003ZIVECM",
      image: "/products/spf.jpg",
    },
  ],
  HTN: [
    {
      name: "Peptide Complex Serum",
      category: "Skincare",
      reason: "Firms skin and enhances facial definition",
      price: "$38.00",
      link: "https://www.amazon.com/dp/B00PAYWCKG",
      image: "/products/peptide.jpg",
    },
  ],
  Chad: [
    {
      name: "EltaMD UV Clear SPF 46",
      category: "Skincare",
      reason: "Premium daily UV protection for high-quality skin maintenance",
      price: "$41.00",
      link: "https://www.amazon.com/dp/B002MSN3QQ",
      image: "/products/elta.jpg",
    },
  ],
  "True Adam": [
    {
      name: "La Mer Moisturizing Cream",
      category: "Luxury Skincare",
      reason: "Maintain and elevate already exceptional skin quality",
      price: "$190.00",
      link: "https://www.amazon.com/dp/B003LZXKCO",
      image: "/products/lamer.jpg",
    },
  ],
};

export function getProductsForLabel(label: string): ProductRecommendation[] {
  return DEMO_PRODUCTS[label] || DEMO_PRODUCTS["MTN"];
}

export async function analyzeFace(
  frontImageBase64: string,
  sideImageBase64: string
): Promise<ScanResult> {
  const prompt = `You are an expert facial aesthetics analyst. Analyze the provided front and side profile photos with scientific precision.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "rating": <integer 0-100 representing overall aesthetic score>,
  "analysis": {
    "jawline": "<2-3 sentence specific assessment of jaw definition, angles, and development>",
    "symmetry": "<2-3 sentence assessment of bilateral facial symmetry>",
    "skinQuality": "<2-3 sentence assessment of skin texture, clarity, and evenness>",
    "eyeArea": "<2-3 sentence assessment of eye spacing, orbital area, and periorbital region>",
    "noseProfile": "<2-3 sentence assessment of nose bridge, tip projection, and profile>",
    "overallStructure": "<2-3 sentence summary of overall facial bone structure and proportions>"
  },
  "roadmap": [
    {
      "timeframe": "0-30 days",
      "title": "Foundation Phase",
      "priority": "critical",
      "steps": ["<specific actionable step based on the analysis>", "<step>", "<step>"]
    },
    {
      "timeframe": "1-3 months",
      "title": "Optimization Phase",
      "priority": "high",
      "steps": ["<step>", "<step>", "<step>"]
    },
    {
      "timeframe": "3-12 months",
      "title": "Transformation Phase",
      "priority": "medium",
      "steps": ["<step>", "<step>", "<step>"]
    }
  ]
}

Be specific, reference what you actually see in the images. Do not use generic advice. The rating must reflect actual aesthetic quality honestly.`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: frontImageBase64,
      },
    },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: sideImageBase64,
      },
    },
    prompt,
  ]);

  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response format");

  const parsed = JSON.parse(jsonMatch[0]);
  const label = getRatingLabel(parsed.rating);
  const products = getProductsForLabel(label);

  return {
    rating: parsed.rating,
    label,
    analysis: parsed.analysis,
    roadmap: parsed.roadmap,
    products,
  };
}
