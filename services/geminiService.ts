
import { GoogleGenAI } from "@google/genai";
import { Booking, Student } from "../types";

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

export const getSuggestedPrice = async (student: Student, allBookings: Booking[]): Promise<number | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const studentHistory = allBookings.filter(b => b.studentId === student.id);
  const similarBookings = allBookings.filter(b => b.studentId !== student.id);

  const prompt = `
    As an AI pricing analyst for a library, suggest a fair price for a new booking.

    Student Details:
    - Name: ${student.name}
    - Previous Bookings: ${studentHistory.length}
    - Default Price: ₹${student.defaultPrice || 'Not Set'}

    Recent comparable bookings by other students:
    ${JSON.stringify(similarBookings.slice(0, 5).map(b => ({ duration: `${b.startDate} to ${b.endDate}`, price: b.amount })), null, 2)}

    Based on this data, what is a fair price for a new standard monthly booking? Return only the numeric value, no currency symbols or text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const price = parseInt(response.text, 10);
    return isNaN(price) ? null : price;
  } catch (error) {
    console.error("Gemini Price Suggestion Error:", error);
    return null;
  }
};
