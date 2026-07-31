import { isBookRarity, BOOK_RARITY_LABELS_FR } from "@/lib/book-rarities";

const PRICE_REGEX = /^\d{1,8}(\.\d{1,2})?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SUMMARY_MAX_LENGTH = 2000;
const EAN_REGEX = /^[0-9]{13}$/;
const ISBN_REGEX = /^[0-9]{13}$/;
const COVER_URL_REGEX = /^(https?:\/\/\S+|\/\S*)$/i;
const COVER_URL_MAX_LENGTH = 255;

export type BookFormFields = {
  title: string;
  summary: string;
  editor: string;
  publication_date: string;
  ean: string;
  isbn: string;
  purchase_price: string;
  sale_price: string;
  rarity: string;
  cover_url: string;
  category_id: number;
  format_id: number;
  series: string;
  volume: string;
  collection: string;
  alert_threshold: string;
  author_ids: number[];
};

export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function getRarityOptions() {
  return Object.entries(BOOK_RARITY_LABELS_FR).map(([value, label]) => ({
    value,
    label,
  }));
}

export function validateBookFormFields(
  fields: BookFormFields,
  options?: { requireAlertThreshold?: boolean },
): string | null {
  const title = fields.title.trim();
  const summary = fields.summary.trim();
  const editor = fields.editor.trim();
  const publicationDate = fields.publication_date.trim();
  const ean = normalizeDigits(fields.ean);
  const isbn = normalizeDigits(fields.isbn);
  const purchasePrice = fields.purchase_price.trim();
  const salePrice = fields.sale_price.trim();
  const coverUrl = fields.cover_url.trim();
  const series = fields.series.trim();
  const volume = fields.volume.trim();
  const alertThreshold = fields.alert_threshold.trim();
  const requireAlertThreshold = options?.requireAlertThreshold === true;

  if (!title) {
    return "Le titre est obligatoire.";
  }
  if (title.length > 191) {
    return "Le titre ne peut pas dépasser 191 caractères.";
  }

  if (!summary) {
    return "Le résumé est obligatoire.";
  }
  if (summary.length > SUMMARY_MAX_LENGTH) {
    return `Le résumé ne peut pas dépasser ${SUMMARY_MAX_LENGTH} caractères.`;
  }

  if (!editor) {
    return "L'éditeur est obligatoire.";
  }
  if (editor.length > 191) {
    return "L'éditeur ne peut pas dépasser 191 caractères.";
  }

  if (!publicationDate) {
    return "La date de parution est obligatoire.";
  }
  if (!DATE_REGEX.test(publicationDate)) {
    return "La date de parution doit être au format AAAA-MM-JJ.";
  }

  if (!ean) {
    return "L'EAN est obligatoire.";
  }
  if (!EAN_REGEX.test(ean)) {
    return "L'EAN doit contenir exactement 13 chiffres.";
  }

  if (!isbn) {
    return "L'ISBN est obligatoire.";
  }
  if (!ISBN_REGEX.test(isbn)) {
    return "L'ISBN doit contenir exactement 13 chiffres.";
  }

  if (!purchasePrice) {
    return "Le prix d'achat est obligatoire.";
  }
  if (!PRICE_REGEX.test(purchasePrice) || Number(purchasePrice) <= 0) {
    return "Le prix d'achat doit être un montant positif valide.";
  }

  if (salePrice && (!PRICE_REGEX.test(salePrice) || Number(salePrice) <= 0)) {
    return "Le prix de vente doit être un montant positif valide.";
  }

  if (!isBookRarity(fields.rarity)) {
    return "La rareté sélectionnée est invalide.";
  }

  if (coverUrl) {
    if (coverUrl.length > COVER_URL_MAX_LENGTH) {
      return "L'URL de couverture est trop longue.";
    }
    if (!COVER_URL_REGEX.test(coverUrl)) {
      return "L'URL de couverture doit commencer par http(s):// ou /.";
    }
  }

  if (!fields.category_id) {
    return "La catégorie est obligatoire.";
  }

  if (!fields.format_id) {
    return "Le format est obligatoire.";
  }

  const seriesSet = series.length > 0;
  const volumeSet = volume.length > 0;
  if (seriesSet !== volumeSet) {
    return "La série et le volume doivent être renseignés ensemble.";
  }
  if (volumeSet) {
    const volumeNumber = Number(volume);
    if (!Number.isInteger(volumeNumber) || volumeNumber < 1) {
      return "Le volume doit être un entier positif.";
    }
  }

  if (requireAlertThreshold || alertThreshold) {
    if (requireAlertThreshold && !alertThreshold) {
      return "Le seuil d'alerte est obligatoire.";
    }
    const threshold = Number(alertThreshold);
    if (!Number.isInteger(threshold) || threshold < 0) {
      return "Le seuil d'alerte doit être un entier positif ou nul.";
    }
  }

  if (fields.author_ids.length === 0) {
    return "Au moins un auteur est obligatoire.";
  }

  return null;
}

export function buildBookFormPayload(
  fields: BookFormFields,
  options: {
    supplier_available: boolean;
    is_active: boolean;
    /** Include only on edit when inventory exists and the value changed. */
    alert_threshold?: number;
  },
) {
  const payload: Record<string, unknown> = {
    title: fields.title.trim(),
    summary: fields.summary.trim(),
    editor: fields.editor.trim(),
    publication_date: fields.publication_date.trim(),
    ean: normalizeDigits(fields.ean),
    isbn: normalizeDigits(fields.isbn),
    purchase_price: fields.purchase_price.trim(),
    sale_price: fields.sale_price.trim() || undefined,
    rarity: fields.rarity,
    cover_url: fields.cover_url.trim() || null,
    category_id: fields.category_id,
    format_id: fields.format_id,
    series: fields.series.trim() || null,
    volume: fields.volume.trim() === "" ? null : Number(fields.volume),
    collection: fields.collection.trim() || null,
    supplier_available: options.supplier_available,
    is_active: options.is_active,
    author_ids: fields.author_ids,
  };

  if (options.alert_threshold !== undefined) {
    payload.alert_threshold = options.alert_threshold;
  }

  return payload;
}

export function formatPublicationDateInput(
  value: string | Date | null | undefined,
): string {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export function formatDecimalInput(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const raw = String(value).trim();
  if (!raw) {
    return "";
  }

  const number = Number(raw);
  if (!Number.isFinite(number)) {
    return raw;
  }

  return raw.includes(".") ? raw : number.toString();
}
