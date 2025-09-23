import fs from "fs";
import PDFGenerator from "pdfkit";

// Types for clarity
interface InstanceDetails {
  toothNumbers?: string[];
  [key: string]: any;
}

interface Service {
  instanceDetails?: InstanceDetails[];
  toothNumbers?: string[];
  teethExtractions?: string[];
  plannedImplantSites?: string[];
  [key: string]: any;
}

interface CaseDetails {
  casePriority?: string;
  patientName: string;
  services: Record<string, Service>;
  additionalNotes?: string;
  splintedCrowns?: string;
}

interface CaseActivity {
  type: "system_update" | "admin_comment" | "user_comment" | string;
  timestamp: number; // unix timestamp
  content: string;
}

export function generateCasePDF(
  caseId: string,
  caseDetails: CaseDetails,
  filePath: string
): void {
  const doc = new PDFGenerator();

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(24).text(`Case Details for TS-${caseId}`).moveDown();

  if (caseDetails.hasOwnProperty("casePriority")) {
    doc
      .fontSize(20)
      .text(`Case Priority ${caseDetails.casePriority}`)
      .moveDown();
  }

  doc
    .fontSize(16)
    .text(`Patient name - ${caseDetails.patientName}`)
    .moveDown()
    .moveDown();

  const services = caseDetails.services;
  Object.keys(services).forEach((serviceKey) => {
    doc.fontSize(16).text(convertKey(serviceKey));

    const service = services[serviceKey];
    Object.keys(service).forEach((fieldKey) => {
      if (fieldKey === "instanceDetails" && Array.isArray(service[fieldKey])) {
        doc.moveDown();
        doc.fontSize(14).text(convertKey(fieldKey) + ": ");
        const instances = service[fieldKey] as InstanceDetails[];
        instances.forEach((instance, idx) => {
          const answers = Object.keys(instance)
            .map((instanceFieldKey) => {
              if (
                instanceFieldKey === "toothNumbers" &&
                Array.isArray(instance["toothNumbers"])
              ) {
                return (
                  "Tooth Numbers: " + instance["toothNumbers"].join(",")
                );
              }
              return (
                convertKey(instanceFieldKey) + ": " + instance[instanceFieldKey]
              );
            })
            .join("\n");
          doc
            .fontSize(12)
            .text("Instance " + (idx + 1).toString() + "\n" + answers + "\n")
            .moveDown();
        });
      } else {
        let text = convertKey(fieldKey) + ": ";
        const value = service[fieldKey];
        if (Array.isArray(value)) {
          text += value.join(",");
        } else {
          text += value;
        }
        doc.fontSize(12).text(text);
      }
    });
    doc.moveDown();
  });

  doc.moveDown();
  doc.fontSize(16).text("Misc. details");

  if (caseDetails.additionalNotes) {
    doc
      .fontSize(12)
      .text("Additional Notes: " + caseDetails.additionalNotes)
      .moveDown();
  }
  if (caseDetails.splintedCrowns) {
    doc
      .fontSize(12)
      .text("Splinted Crowns: " + caseDetails.splintedCrowns)
      .moveDown();
  }

  doc.end();
}

const convertKey = (text: string): string => {
  const result = text.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};

export function generateCommentsPDF(
  caseId: string,
  caseActivities: CaseActivity[],
  priority: string,
  filePath: string
): void {
  const doc = new PDFGenerator();
  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(24).text(`Comments for TS-${caseId}`).moveDown();

  doc
    .fontSize(20)
    .text(`Case Redesign Priority ${priority}`)
    .moveDown()
    .moveDown();

  for (const activity of caseActivities) {
    if (activity.type === "system_update") {
      continue;
    }

    const author =
      activity.type === "admin_comment" ? "ToothSketch Team" : "User";
    doc
      .fontSize(10)
      .text(new Date(activity.timestamp * 1000).toLocaleString())
      .moveDown();
    doc.fontSize(12).text(`${author.toUpperCase()}: `);
    doc.fontSize(12).text(activity.content).moveDown().moveDown();
  }

  doc.end();
}




















// import fs from 'fs'
// import PDFGenerator from 'pdfkit';


// export function generateCasePDF(
//   caseId /* string */,
//   caseDetails /* JSON object */,
//   filePath /* string */
// ) {
//   // instantiate the library
//   let doc = new PDFGenerator();

//   // pipe to a writable stream which would save the result into the same directory
//   doc.pipe(fs.createWriteStream(filePath));

//   doc.fontSize(24).text(`Case Details for TS-${caseId}`).moveDown();

//   if (caseDetails.hasOwnProperty("casePriority")) {
//     doc
//       .fontSize(20)
//       .text(`Case Priority ${caseDetails.casePriority}`)
//       .moveDown();
//   }

//   doc
//     .fontSize(16)
//     .text(`Patient name - ${caseDetails.patientName}`)
//     .moveDown()
//     .moveDown();

//   const services = caseDetails["services"];
//   Object.keys(services).forEach((service) => {
//     doc.fontSize(16).text(convertKey(service));
//     service = services[service];
//     Object.keys(service).forEach((fieldKey) => {
//       if (fieldKey == "instanceDetails") {
//         doc.moveDown();
//         doc.fontSize(14).text(convertKey(fieldKey) + ": ");
//         instances = service[fieldKey];
//         instances.forEach((instance, idx) => {
//           let answers = Object.keys(instance)
//             .map((instanceFieldKey) => {
//               if (instanceFieldKey == "toothNumbers") {
//                 return "Tooth Numbers: " + instance["toothNumbers"].join(",");
//               }
//               return (
//                 convertKey(instanceFieldKey) + ": " + instance[instanceFieldKey]
//               );
//             })
//             .join("\n");
//           doc
//             .fontSize(12)
//             .text("Instance " + (idx + 1).toString() + "\n" + answers + "\n")
//             .moveDown();
//         });
//       } else {
//         let text = convertKey(fieldKey) + ": ";
//         if (
//           fieldKey == "toothNumbers" ||
//           fieldKey == "teethExtractions" ||
//           fieldKey == "plannedImplantSites"
//         ) {
//           text += service[fieldKey].join(",");
//         } else {
//           text += service[fieldKey];
//         }
//         doc.fontSize(12).text(text);
//       }
//     });
//     doc.moveDown();
//   });

//   doc.moveDown();
//   doc.fontSize(16).text("Misc. details");

//   doc
//     .fontSize(12)
//     .text("Additional Notes: " + caseDetails["additionalNotes"])
//     .moveDown();
//   doc
//     .fontSize(12)
//     .text("Splinted Crowns: " + caseDetails["splintedCrowns"])
//     .moveDown();

//   // write out file
//   doc.end();
// }

// const convertKey = (text) => {
//   var result = text.replace(/([A-Z])/g, " $1");
//   return result.charAt(0).toUpperCase() + result.slice(1);
// };

// export function generateCommentsPDF(
//   caseId /* string */,
//   caseActivities /* JSON object */,
//   priority /* string */,
//   filePath /* string */
// ) {
//   let doc = new PDFGenerator();
//   doc.pipe(fs.createWriteStream(filePath));
//   doc.fontSize(24).text(`Comments for TS-${caseId}`).moveDown();

//   doc
//     .fontSize(20)
//     .text(`Case Redesign Priority ${priority}`)
//     .moveDown()
//     .moveDown();

//   for (let activity of caseActivities) {
//     if (activity.type == "system_update") {
//       continue;
//     }

//     const author =
//       activity.type == "admin_comment" ? "ToothSketch Team" : "User";
//     doc
//       .fontSize(10)
//       .text(new Date(activity.timestamp * 1000).toLocaleString())
//       .moveDown();
//     doc.fontSize(12).text(`${author.toUpperCase()}: `);
//     doc.fontSize(12).text(activity.content).moveDown().moveDown();
//   }

//   doc.end();
// }
