import { z } from "zod";

export const adminOperationIdSchema = z.object({ id: z.string().uuid() });
const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");
const clockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Horário inválido.");

export function normalizeOperationTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

function timeInSeconds(value: string): number {
  const [hour, minute, second = 0] = value.split(":").map(Number);
  return hour * 3_600 + minute * 60 + second;
}

function validTimeRange(start: string, end: string): boolean {
  return timeInSeconds(start) < timeInSeconds(end);
}

export function timeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return timeInSeconds(startA) < timeInSeconds(endB) && timeInSeconds(endA) > timeInSeconds(startB);
}

function validTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const adminPanelSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Informe o nome do painel."),
  region: z.string().trim().min(1, "Informe a região."),
  address: z.string().trim().min(1, "Informe o endereço."),
  timezone: z.string().trim().refine(validTimezone, "Timezone inválido."),
  active: z.boolean(),
});

const durationOptionSchema = z.union([
  z.literal(10),
  z.literal(15),
  z.literal(20),
  z.literal(30),
  z.literal(45),
  z.literal(60),
]);

export const adminPanelFormatSchema = z.object({
  id: z.string().uuid().optional(),
  panelId: z.string().uuid("Selecione um painel."),
  width: z.number().int().positive("Informe uma largura válida."),
  height: z.number().int().positive("Informe uma altura válida."),
  orientation: z.enum(["horizontal", "vertical", "ribbon"]),
  durationsAllowed: z
    .array(durationOptionSchema)
    .min(1, "Selecione pelo menos uma duração.")
    .transform((values) => [...new Set(values)].sort((a, b) => a - b)),
});

export const adminPanelHourSchema = z
  .object({
    id: z.string().uuid().optional(),
    panelId: z.string().uuid("Selecione um painel."),
    weekday: z.number().int().min(0).max(6),
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
  })
  .refine((value) => validTimeRange(value.startTime, value.endTime), {
    path: ["endTime"],
    message: "O horário final deve ser posterior ao inicial.",
  });

export const adminPanelHourExceptionSchema = z
  .object({
    id: z.string().uuid().optional(),
    panelId: z.string().uuid("Selecione um painel."),
    date: calendarDateSchema,
    startTime: clockTimeSchema.nullable(),
    endTime: clockTimeSchema.nullable(),
  })
  .superRefine((value, context) => {
    if ((value.startTime == null) !== (value.endTime == null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "Informe início e fim, ou deixe ambos vazios para fechar o dia.",
      });
    }
    if (value.startTime && value.endTime && !validTimeRange(value.startTime, value.endTime)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "O horário final deve ser posterior ao inicial.",
      });
    }
  });

export const adminPricingRuleSchema = z
  .object({
    id: z.string().uuid().optional(),
    panelId: z.string().uuid("Selecione um painel."),
    durationSeconds: z.number().int().positive("Informe uma duração válida."),
    basePrice: z.number().min(0, "O preço não pode ser negativo."),
    discountPct: z.number().min(0).max(100),
    dateStart: calendarDateSchema.nullable(),
    dateEnd: calendarDateSchema.nullable(),
    timeStart: clockTimeSchema.nullable(),
    timeEnd: clockTimeSchema.nullable(),
    weekday: z.number().int().min(0).max(6).nullable(),
  })
  .superRefine((value, context) => {
    if ((value.dateStart == null) !== (value.dateEnd == null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateEnd"],
        message: "Informe as duas datas do período.",
      });
    }
    if (value.dateStart && value.dateEnd && value.dateEnd < value.dateStart) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateEnd"],
        message: "A data final deve ser posterior ou igual à inicial.",
      });
    }
    if ((value.timeStart == null) !== (value.timeEnd == null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeEnd"],
        message: "Informe os dois horários da faixa.",
      });
    }
    if (value.timeStart && value.timeEnd && !validTimeRange(value.timeStart, value.timeEnd)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeEnd"],
        message: "O horário final deve ser posterior ao inicial.",
      });
    }
  });

export const adminBlackoutSchema = z
  .object({
    id: z.string().uuid().optional(),
    panelId: z.string().uuid("Selecione um painel."),
    date: calendarDateSchema,
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
    reason: z.string().trim().max(500).nullable(),
  })
  .refine((value) => validTimeRange(value.startTime, value.endTime), {
    path: ["endTime"],
    message: "O horário final deve ser posterior ao inicial.",
  });
