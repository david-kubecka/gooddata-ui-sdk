import { IAxis } from "../../interfaces/Config";
import { IHighchartsAxisExtend } from "../HighchartsExtend";

export const isPrimaryYAxis = (yAxis: IAxis | IHighchartsAxisExtend) => !yAxis.opposite;