import { Router } from "express";
import {
  getAllCasesData,
} from "../controllers/newWatchLogic.js";

const router = Router();

router.get("/cases/details", getAllCasesData);

export default router;











// import { Router } from "express";
// import { getAllDates, getCasesByDate } from "../controllers/newWatchLogic.js";

// const router = Router();

// router.get("/cases/dates", getAllDates);
// router.get("/cases/details/:activeDate", getCasesByDate);

// export default router;
