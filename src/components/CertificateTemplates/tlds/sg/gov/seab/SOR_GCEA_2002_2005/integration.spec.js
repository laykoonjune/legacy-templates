import { Selector } from "testcafe";
import { readFileSync } from "fs";
import { join } from "path";
import { getData } from "@govtechsg/open-attestation";

fixture("Singapore Examinations and Assessment Board (SOR_GCEA_2002_2005)")
  .page`http://localhost:3000`;

const Certificate = "./SOR_ALL-2002_GCEA_30111602.opencert";
const RenderedCertificate = Selector("#rendered-certificate");

const validateTextContent = async (t, component, texts) =>
  texts.reduce(
    async (prev, curr) => t.expect(component.textContent).contains(curr),
    Promise.resolve()
  );

test("sg/gov/seab/SOR_GCEA_2002_2005 is rendered correctly", async t => {
  // Inject javascript and execute window.opencerts.renderDocument
  const certificateContent = getData(
    JSON.parse(readFileSync(join(__dirname, Certificate)).toString())
  );
  await t.eval(() => window.opencerts.renderDocument(certificateContent), {
    dependencies: { certificateContent }
  });

  // Check content of window.opencerts.templates
  const container = Selector("#rendered-certificate .container");
  await container(); // wait for document to be rendered
  const templates = await t.eval(() => window.opencerts.getTemplates());
  await t
    .expect(templates)
    .eql([
      { id: "sor", label: "Statement of Results", template: undefined },
      { id: "explanatorydtl", label: "Explanatory Notes", template: undefined }
    ]);

  // SOR tab content
  await validateTextContent(t, RenderedCertificate, [
    "I certify that in the",
    "Examination held in the year",
    "Candidate",
    "NRIC/Foreign Identification No.",
    "Index No.",
    "obtained the grades for the subjects stated below:",
    "SUBJECT",
    "GRADE",
    "LEVEL",
    "Total number of subjects recorded:",
    "This statement is issued to",
    "Singapore Examinations and Assessment Board",
    "SINGAPORE-CAMBRIDGE GENERAL CERTIFICATE OF EDUCATION ADVANCED LEVEL",
    "3011/1602",
    "ONE",
    "Chief Executive"
  ]);

  // Navigate to Explanatory Notes tab
  await t.eval(() => window.opencerts.selectTemplateTab(1));

  // Explanatory Notes tab content
  await validateTextContent(t, RenderedCertificate, [
    "EXPLANATORY NOTES",
    "REMARKS",
    "As of 2002, subjects taken under access arrangements are annotated with the following symbols:",
    "Fail"
  ]);
});
