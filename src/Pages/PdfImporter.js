import React, { useState } from "react";

const PdfImporter = () => {
  const [pdfContent, setPdfContent] = useState("");

  const loadPdfContent = async (file) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const pdfData = new Uint8Array(reader.result);
      const loadingTask = window.pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();

      // Join all text items into a single string
      const text = textContent.items.map((item) => item.str).join(""); // Join the array of words into a string

      console.log("The whole text:", text);

      // Function to clean the text
      const cleanText = (paragraph) => {
        // Remove special characters like •
        let cleaned = paragraph.replace(/[•]/g, "");
        // Remove sentences that are just numbers
        cleaned = cleaned.replace(/\b\d+\b/g, "");
        return cleaned;
      };

      // Function to split text into sentences and filter out empty sentences
      const splitIntoSentences = (paragraph) => {
        return paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g)
          .map(sentence => sentence.trim())
          .filter(sentence => sentence !== ""); // Filter out empty sentences
      };

      // Function to generate CSV content from COs
      const generateCOsCsvContent = (sentences) => {
        let COsCsvContent = "";
        sentences.forEach((sentence, index) => {
          const coNumber = index + 1; // CO1, CO2, CO3, ...
          COsCsvContent += `CO${coNumber};"${sentence}"\n`;
        });
        return COsCsvContent;
      };

      // Regex to extract Academic Year
      const regexAcademicYear = /Current Academic Year:\s*(\d{4}-\d{4})/; // Matches "Current Academic Year: 2024-2025"
      const matchAcademicYear = text.match(regexAcademicYear);
      const extractedAcademicYear = matchAcademicYear ? matchAcademicYear[1] : "Not found";

      console.log("Extracted Academic Year:", extractedAcademicYear);

      const regexCourseTitle = /(?<=Course Title\s+)([\s\S]+?)(?=\s+Credits)/;
      const matchCourseTitle = text.match(regexCourseTitle);

      const regexCourseObjective = /(?<=Course Objective\s+)([\s\S]+?)(?=\s+Course Outcomes)/;
      const matchCourseObjective = text.match(regexCourseObjective);

      if (matchCourseTitle && matchCourseObjective) {
        const extractedCourseTitle = matchCourseTitle[1].trim(); // Trim extra spaces
        let extractedCourseObjective = matchCourseObjective[1].trim(); // Trim extra spaces

        // Clean the course objective text
        extractedCourseObjective = cleanText(extractedCourseObjective);

        // Split cleaned objective into sentences
        const sentences = splitIntoSentences(extractedCourseObjective);
        console.log("Sentences:", sentences);

        console.log("Extracted Course Title:", extractedCourseTitle);
        console.log("Extracted Course Objective:", extractedCourseObjective);

        // Create CSV content with specific cells
        const csvHeaderContent = `
;Title;"${extractedCourseTitle}"
;Academic Year      ;"${extractedAcademicYear}"

"CO statements "
${generateCOsCsvContent(sentences)}
        `;

        // Create a Blob containing the CSV file
        const blob = new Blob([csvHeaderContent], { type: "text/csv;charset=utf-8" });

        // Create download link and trigger download
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = "extracted_text.csv";
        downloadLink.click();
      } else {
        if (!matchCourseTitle) {
          console.log("Course Title not found in PDF content.");
        }
        if (!matchCourseObjective) {
          console.log("Course Objective not found in PDF content.");
        }
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const onChange = (e) => {
    const file = e.target.files[0];
    loadPdfContent(file);
  };

  return (
    <div>
      <div>
        <p>Upload your PDF file to extract text:</p>
        <input type="file" onChange={onChange} />
        <div>
          <p>{pdfContent}</p>
        </div>
      </div>
    </div>
  );
};

export default PdfImporter;
