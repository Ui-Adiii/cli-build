import config from "../../config/config";

export const isOwner = (id: number) => String(id) === config['telegram-owner-id'] || process.env.TELEGRAM_OWNER_ID ?.trim();
