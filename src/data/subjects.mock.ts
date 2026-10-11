import { Subject } from "../models/subject.model";

export const initialMockSubjects: Subject[] = [
  {
    id: "sub-001",
    code: "SUB-WORD",
    name: "Microsoft Word",
    description: "ការរៀបចំឯកសារ ការវាយអត្ថបទ និងទម្រង់បែបបទរដ្ឋបាល",
    duration: "45 ម៉ោង",
    status: "active",
  },
  {
    id: "sub-002",
    code: "SUB-EXCEL",
    name: "Microsoft Excel",
    description: "ការគ្រប់គ្រងទិន្នន័យ តារាងគណនា និងរូបមន្តកម្រិតខ្ពស់",
    duration: "60 ម៉ោង",
    status: "active",
  },
  {
    id: "sub-003",
    code: "SUB-PPT",
    name: "Microsoft PowerPoint",
    description: "ការបង្កើតផ្ទាំងស្លាយបទបង្ហាញ និងចលនាឌីជីថល",
    duration: "30 ម៉ោង",
    status: "active",
  },
  {
    id: "sub-004",
    code: "SUB-ACCESS",
    name: "Microsoft Access",
    description: "មូលដ្ឋានទិន្នន័យ Database និងប្រព័ន្ធទម្រង់ Form/Report",
    duration: "45 ម៉ោង",
    status: "active",
  },
  {
    id: "sub-005",
    code: "SUB-TYPING",
    name: "Typing & Khmer Unicode",
    description: "បច្ចេកទេសវាយអក្សរខ្មែរ និងអង់គ្លេសល្បឿនលឿនដោយម្រាមដៃដប់",
    duration: "20 ម៉ោង",
    status: "active",
  },
  {
    id: "sub-006",
    code: "SUB-BASIC",
    name: "Basic Computer & Internet",
    description: "មូលដ្ឋានគ្រឹះកុំព្យូទ័រ Windows, Internet និងការប្រើប្រាស់ Email",
    duration: "40 ម៉ោង",
    status: "active",
  },
];
