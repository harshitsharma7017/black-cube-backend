import { Request, Response, NextFunction } from 'express';
import { SummaryService } from '../services/summary.service';

export class SummaryController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const counts = await SummaryService.getSummaryCounts();
      res.json({ data: counts, error: null, meta: null });
    } catch (error) {
      next(error);
    }
  }
}