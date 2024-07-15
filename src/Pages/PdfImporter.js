import React, { useState } from "react";
import * as XLSX from "xlsx";

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

      // Function to generate Excel data from COs
      const generateCOsExcelData = (sentences) => {
        const data = sentences.map((sentence, index) => ({
          CO: `CO${index + 1}`,
          Statement: sentence
        }));
        return data;
      };

      // Function to extract the last two numbers of the current year of study
      const yearTwoDigits = (yearString) => {
        if (!yearString) {
          return "";
        }
        let firstYear = yearString.split('-')[0];
        const lastTwoDigits = firstYear.slice(-2);
        return lastTwoDigits;
      };

      // Regex to extract Academic Year
      const regexAcademicYear = /Current Academic Year:\s*(\d{4}-\d{4})/; // Matches "Current Academic Year: 2024-2025"
      const matchAcademicYear = text.match(regexAcademicYear);
      const extractedAcademicYear = matchAcademicYear ? matchAcademicYear[1] : "Not found";

      console.log("Extracted Academic Year:", extractedAcademicYear);
      
      // Regex to extract the course title
      const regexCourseTitle = /(?<=Course Title\s+)([\s\S]+?)(?=\s+Credits)/;
      const matchCourseTitle = text.match(regexCourseTitle);

      // Regex to extract the course objectives
      const regexCourseObjective = /(?<=Course Objective\s+)([\s\S]+?)(?=\s+Course Outcomes)/;
      const matchCourseObjective = text.match(regexCourseObjective);

      // Regex to extract the semester
      const regexSemester = /Semester:\s*(\d+)/; // Matches "Semester: 1"
      const matchSemester = text.match(regexSemester);
      const extractedSemester = matchSemester ? matchSemester[1] : "Not found";

      console.log("Extracted Semester:", extractedSemester.slice(-1));

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

        // Create Excel data
        const excelData = [
          { Title: extractedCourseTitle },
          { AcademicYear: extractedAcademicYear },
          { PassingTerm: yearTwoDigits(extractedAcademicYear) + "0" + extractedSemester.slice(-1) },
          { YearOfCourse: "" },
          { Semester: extractedSemester.slice(-1) },
          { Faculty: "" },
          { COStatements: "" },
          ...generateCOsExcelData(sentences)
        ];

        // Convert JSON data to worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Create a new workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CourseData");

        // Generate XLSX file and download
        XLSX.writeFile(workbook, "extracted_text.xlsx");
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
