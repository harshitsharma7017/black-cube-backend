import { RecordModel } from "../models/record.model";

export class SummaryService {
  static async getSummaryCounts() {
    const result = await RecordModel.aggregate([
      {
        $group: {
          _id: null,
          all: { $sum: 1 },
          students: { $sum: { $cond: [{ $eq: ["$type", "Student"] }, 1, 0] } },
          teachers: { $sum: { $cond: [{ $eq: ["$type", "Teacher"] }, 1, 0] } },
          institutes: { $sum: { $cond: [{ $eq: ["$type", "Institute"] }, 1, 0] } },
        },
      },
    ]);

    if (!result || result.length === 0) {
      return { all: 0, students: 0, teachers: 0, institutes: 0 };
    }

    const { _id, ...counts } = result[0];
    return counts;
  }
}