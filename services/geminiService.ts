
import { GoogleGenAI } from "@google/genai";
import { Booking } from "../types";

export const getAIInsights = async (bookings: Booking[], totalRevenue: number, totalDues: number) => {
  // Initialize with named parameter as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const bookingSummary = bookings.map(b => ({
    student: b.studentName,
    seat: b.seatNumber,
    dates: `${b.startDate} to ${b.endDate}`,
    amount: b.amount,
    paid: b.paidAmount,
    status: b.feeStatus
  }));

  const prompt = `
    As an AI business analyst for LibriSeat Pro, analyze the following library management data:
    Total Revenue: ₹${totalRevenue}
    Total Dues Outstanding: ₹${totalDues}
    Number of active bookings: ${bookings.length}
    
    Data Details:
    ${JSON.stringify(bookingSummary, null, 2)}
    
    Provide a concise report including:
    1. Financial health summary.
    2. Identification of critical unpaid dues.
    3. Recommendations for maximizing seat occupancy or improving collection.
    4. A witty "librarian's tip" for the day.
    
    Format the output in clean Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use .text property instead of text() method
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to load AI insights. Please check your connection or API key.";
  }
};
