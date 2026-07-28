"use client";

import { AuthorPublic } from "@/services/authors/types";
import { CategoryPublic } from "@/services/categories/types";
import { FormatPublic } from "@/services/formats/types";
import { BOOK_RARITIES, type BookRarity } from "@/lib/book-rarities";
import type { BookWithAuthors } from "@/services/books/types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  buildBookFormPayload,
  formatDecimalInput,
  formatPublicationDateInput,
  getRarityOptions,
  type BookFormFields,
  validateBookFormFields,
} from "./book-form-validation";
import BookFormAuthorsField from "./BookFormAuthorsField";
import BookFormSelect from "./BookFormSelect";

type FormStatus = "idle" | "loading" | "error";
type LoadStatus = "idle" | "loading" | "ready" | "error";

const labelClass =
  "mb-2 block font-headline-lg text-sm uppercase tracking-widest text-burnished-gold/80";

const inputClass = "w-full rpg-input px-4 py-3 font-body-md text-sm";

function filterPriceInput(raw: string): string {
  const value = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const dotIndex = value.indexOf(".");

  if (dotIndex === -1) {
    return value.slice(0, 8);
  }

  const intPart = value.slice(0, dotIndex).slice(0, 8);
  const decPart = value
    .slice(dotIndex + 1)
    .replace(/\./g, "")
    .slice(0, 2);

  if (intPart.length === 0) {
    return decPart.length > 0 ? `0.${decPart}` : "";
  }

  return `${intPart}.${decPart}`;
}

function filterDigitsInput(raw: string, maxLength?: number): string {
  const digits = raw.replace(/\D/g, "");
  return maxLength !== undefined ? digits.slice(0, maxLength) : digits;
}

function FormToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border border-burnished-gold/20 bg-surface-container-low p-4">
      <label
        htmlFor={id}
        className="font-headline-lg text-sm uppercase tracking-widest text-burnished-gold/80"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`book-form-toggle ${checked ? "book-form-toggle--on" : ""}`}
      >
        <span className="book-form-toggle-thumb" aria-hidden />
      </button>
    </div>
  );
}

export default function BookForm({ id = "" }: { id?: string }) {
  const router = useRouter();
  const isEditMode = id.trim() !== "";
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [editor, setEditor] = useState("");
  const [publication_date, setPublicationDate] = useState("");
  const [ean, setEan] = useState("");
  const [isbn, setIsbn] = useState("");
  const [purchase_price, setPurchasePrice] = useState("");
  const [sale_price, setSellingPrice] = useState("");
  const [rarity, setRarity] = useState<BookRarity>("common");
  const [cover_url, setCoverUrl] = useState("");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [category_id, setCategoryId] = useState<number>(0);
  const [format_id, setFormatId] = useState<number>(0);
  const [series, setSeries] = useState("");
  const [volume, setVolume] = useState("");
  const [collection, setCollection] = useState("");
  const [supplier_available, setSupplierAvailable] = useState(true);
  const [alert_threshold, setAlertThreshold] = useState("2");
  const [is_active, setIsActive] = useState(true);
  const [author_ids, setAuthorIds] = useState<number[]>([]);

  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [authors, setAuthors] = useState<AuthorPublic[]>([]);
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [formats, setFormats] = useState<FormatPublic[]>([]);
  const [referentialsStatus, setReferentialsStatus] =
    useState<LoadStatus>("loading");
  const [bookLoadStatus, setBookLoadStatus] = useState<LoadStatus>(
    isEditMode ? "loading" : "idle",
  );

  async function loadReferentials() {
    setReferentialsStatus("loading");

    try {
      const [authorsResponse, categoriesResponse, formatsResponse] =
        await Promise.all([
          fetch("/api/authors"),
          fetch("/api/categories"),
          fetch("/api/formats"),
        ]);

      if (
        !authorsResponse.ok ||
        !categoriesResponse.ok ||
        !formatsResponse.ok
      ) {
        throw new Error("Impossible de charger les listes du formulaire.");
      }

      const [authorsBody, categoriesBody, formatsBody] = await Promise.all([
        authorsResponse.json(),
        categoriesResponse.json(),
        formatsResponse.json(),
      ]);

      setAuthors(authorsBody.data ?? []);
      setCategories(categoriesBody.data ?? []);
      setFormats(formatsBody.data ?? []);
      setReferentialsStatus("ready");
    } catch {
      setReferentialsStatus("error");
      setErrorMessage(
        "Impossible de charger les catégories, formats ou auteurs.",
      );
    }
  }

  async function loadBook(bookId: string) {
    setBookLoadStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/books/${bookId}`);
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error?.message ?? "Livre introuvable.");
      }

      const book = body.data as BookWithAuthors;
      setTitle(book.title);
      setSummary(book.summary);
      setEditor(book.editor);
      setPublicationDate(formatPublicationDateInput(book.publication_date));
      setEan(book.ean);
      setIsbn(book.isbn);
      setPurchasePrice(formatDecimalInput(book.purchase_price));
      setSellingPrice(formatDecimalInput(book.sale_price));
      setRarity(
        BOOK_RARITIES.includes(book.rarity as BookRarity)
          ? (book.rarity as BookRarity)
          : "common",
      );
      setCoverUrl(book.cover_url ?? "");
      setCategoryId(book.category_id);
      setFormatId(book.format_id);
      setSeries(book.series ?? "");
      setVolume(book.volume != null ? String(book.volume) : "");
      setCollection(book.collection ?? "");
      setSupplierAvailable(book.supplier_available);
      setAlertThreshold(String(book.alert_threshold));
      setIsActive(book.is_active);
      setAuthorIds(book.authors.map((author) => author.id));
      setBookLoadStatus("ready");
    } catch (error) {
      setBookLoadStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger le livre.",
      );
    }
  }

  useEffect(() => {
    void loadReferentials();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      void loadBook(id);
    }
  }, [id, isEditMode]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  function clearLocalCoverPreview() {
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
    setCoverPreviewUrl(null);
    setCoverFileName(null);
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = "";
    }
  }

  function handleCoverFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Veuillez sélectionner un fichier image.");
      event.target.value = "";
      return;
    }

    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    setCoverUrl("");
    setCoverPreviewUrl(URL.createObjectURL(file));
    setCoverFileName(file.name);
    setErrorMessage(null);
  }

  function handleCoverUrlChange(value: string) {
    setCoverUrl(value);
    if (value.trim()) {
      clearLocalCoverPreview();
    }
  }

  function handleRemoveCover() {
    clearLocalCoverPreview();
    setCoverUrl("");
  }

  const isLoading = status === "loading";
  const isFormDisabled =
    isLoading ||
    referentialsStatus !== "ready" ||
    (isEditMode && bookLoadStatus !== "ready");
  const displayedCoverSrc = coverPreviewUrl || cover_url.trim() || null;
  const rarityOptions = getRarityOptions();

  function getFormFields(): BookFormFields {
    return {
      title,
      summary,
      editor,
      publication_date,
      ean,
      isbn,
      purchase_price,
      sale_price,
      rarity,
      cover_url,
      category_id,
      format_id,
      series,
      volume,
      collection,
      alert_threshold,
      author_ids,
    };
  }

  function openCoverFilePicker() {
    if (!isFormDisabled) {
      coverFileInputRef.current?.click();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const fields = getFormFields();
    const validationError = validateBookFormFields(fields);
    if (validationError) {
      setStatus("error");
      setErrorMessage(validationError);
      return;
    }

    setStatus("loading");

    try {
      const payload = buildBookFormPayload(fields, {
        supplier_available,
        is_active,
      });

      const response = await fetch(
        isEditMode ? `/api/books/${id}` : "/api/books",
        {
          method: isEditMode ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const body = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(
          body.error?.message ??
            "Une erreur est survenue lors de la création/sauvegarde du livre.",
        );
        return;
      }

      const bookId = body.data?.id ?? (isEditMode ? Number(id) : null);
      if (!bookId) {
        setStatus("error");
        setErrorMessage("Réponse serveur invalide après enregistrement.");
        return;
      }

      router.push(`/catalog/${bookId}`);
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage(
        "Une erreur est survenue lors de la création/sauvegarde du livre.",
      );
    }
  }

  if (referentialsStatus === "loading" || bookLoadStatus === "loading") {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3 font-label text-xs tracking-widest text-burnished-gold/80 uppercase">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span>Chargement du formulaire…</span>
      </div>
    );
  }

  if (referentialsStatus === "error" || bookLoadStatus === "error") {
    return (
      <div className="border border-error/40 bg-error/5 p-6">
        <p className="font-label text-xs tracking-wide text-error uppercase">
          {errorMessage ??
            "Impossible d'afficher le formulaire pour le moment."}
        </p>
      </div>
    );
  }

  return (
    <form className="book-form space-y-8" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Colonne gauche — Informations du Codex */}
        <div className="space-y-8 lg:col-span-7">
          <div className="mb-8 flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
            <h2 className="font-headline-xl text-3xl uppercase tracking-widest text-ethereal-glow">
              Informations du Codex
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="title" className={labelClass}>
                Titre*
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entrez le titre officiel..."
                disabled={isFormDisabled}
                className={`${inputClass} text-lg italic`}
              />
            </div>

            <div>
              <label htmlFor="summary" className={labelClass}>
                Résumé du manuscrit*
              </label>
              <textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brève description de l'œuvre..."
                rows={4}
                disabled={isFormDisabled}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="editor" className={labelClass}>
                  Éditeur*
                </label>
                <input
                  type="text"
                  id="editor"
                  value={editor}
                  onChange={(e) => setEditor(e.target.value)}
                  placeholder="Maison d'édition"
                  disabled={isFormDisabled}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="publication_date" className={labelClass}>
                  Date de parution*
                </label>
                <input
                  type="date"
                  id="publication_date"
                  value={publication_date}
                  onChange={(e) => setPublicationDate(e.target.value)}
                  disabled={isFormDisabled}
                  className={`${inputClass} font-label-sm text-xs uppercase`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="isbn" className={labelClass}>
                  ISBN-13*
                </label>
                <input
                  type="text"
                  id="isbn"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-..."
                  disabled={isFormDisabled}
                  className={`${inputClass} font-label-sm`}
                />
              </div>
              <div>
                <label htmlFor="ean" className={labelClass}>
                  EAN*
                </label>
                <input
                  type="text"
                  id="ean"
                  value={ean}
                  onChange={(e) => setEan(e.target.value)}
                  placeholder="376-..."
                  disabled={isFormDisabled}
                  className={`${inputClass} font-label-sm`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="purchase_price" className={labelClass}>
                  Prix d&apos;achat*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    id="purchase_price"
                    value={purchase_price}
                    onChange={(e) =>
                      setPurchasePrice(filterPriceInput(e.target.value))
                    }
                    placeholder="0.00"
                    disabled={isFormDisabled}
                    className={`${inputClass} pr-10 font-label-sm`}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 font-label-sm text-sm text-outline">
                    €
                  </span>
                </div>
              </div>
              <div>
                <label htmlFor="sale_price" className={labelClass}>
                  Prix de vente*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    id="sale_price"
                    value={sale_price}
                    onChange={(e) =>
                      setSellingPrice(filterPriceInput(e.target.value))
                    }
                    placeholder="0.00"
                    disabled={isFormDisabled}
                    className={`${inputClass} pr-10 font-label-sm`}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 font-label-sm text-sm text-outline">
                    €
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="category_id" className={labelClass}>
                  Catégorie*
                </label>
                <BookFormSelect
                  id="category_id"
                  value={category_id === 0 ? "" : String(category_id)}
                  onChange={(value) =>
                    setCategoryId(value ? Number(value) : 0)
                  }
                  placeholder="Sélectionner une catégorie..."
                  disabled={isFormDisabled}
                  options={categories.map((category) => ({
                    value: String(category.id),
                    label: category.name,
                  }))}
                />
              </div>
              <div>
                <label htmlFor="format_id" className={labelClass}>
                  Format*
                </label>
                <BookFormSelect
                  id="format_id"
                  value={format_id === 0 ? "" : String(format_id)}
                  onChange={(value) => setFormatId(value ? Number(value) : 0)}
                  placeholder="Sélectionner un format..."
                  disabled={isFormDisabled}
                  options={formats.map((format) => ({
                    value: String(format.id),
                    label: format.name,
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="rarity" className={labelClass}>
                  Rareté*
                </label>
                <BookFormSelect
                  id="rarity"
                  value={rarity}
                  onChange={(value) => setRarity(value as BookRarity)}
                  placeholder="Commun"
                  showPlaceholder={false}
                  disabled={isFormDisabled}
                  options={rarityOptions}
                />
              </div>
              <div>
                <label htmlFor="collection" className={labelClass}>
                  Collection
                </label>
                <input
                  type="text"
                  id="collection"
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  placeholder="Nom de la collection"
                  disabled={isFormDisabled}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="series" className={labelClass}>
                  Série
                </label>
                <input
                  type="text"
                  id="series"
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  placeholder="Nom de la série"
                  disabled={isFormDisabled}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="volume" className={labelClass}>
                  Volume
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  id="volume"
                  value={volume}
                  onChange={(e) =>
                    setVolume(filterDigitsInput(e.target.value, 6))
                  }
                  placeholder="N°"
                  disabled={isFormDisabled}
                  className={`${inputClass} font-label-sm`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="author_ids-picker" className={labelClass}>
                Auteur(s)*
              </label>
              <BookFormAuthorsField
                id="author_ids"
                authorIds={author_ids}
                authors={authors}
                disabled={isFormDisabled}
                onChange={setAuthorIds}
              />
            </div>
          </div>
        </div>

        {/* Colonne droite — Stock & Alertes */}
        <div className="space-y-8 lg:col-span-5">
          <div className="mb-8 flex flex-col items-start justify-between border-l-4 border-burnished-gold pl-6 sm:flex-row sm:items-start">
            <h2 className="font-headline-xl text-3xl uppercase tracking-widest text-ethereal-glow">
              Stock &amp; Alertes
            </h2>
            <span className="mt-2 border border-burnished-gold/30 bg-burnished-gold/10 px-2 py-1 font-label-sm text-[10px] tracking-wider text-burnished-gold/80 uppercase">
              {id ? `#STK-EDIT` : `#STK-NEW`}
            </span>
          </div>

          <div className="rpg-window mb-4">
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverFileChange}
              disabled={isFormDisabled}
              className="sr-only"
              aria-label="Sélectionner une image de couverture"
            />
            <button
              type="button"
              onClick={openCoverFilePicker}
              disabled={isFormDisabled}
              className="rpg-window-inner book-form-cover-inner group relative w-full cursor-pointer overflow-hidden border-0 p-0 text-left transition-colors hover:bg-surface-container-low/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {displayedCoverSrc ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayedCoverSrc}
                    alt="Aperçu de la couverture"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <span
                      className="material-symbols-outlined text-3xl text-burnished-gold"
                      aria-hidden
                    >
                      upload
                    </span>
                    <p className="mt-2 font-label-sm text-[10px] tracking-widest text-burnished-gold uppercase">
                      Changer l&apos;image
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined text-4xl text-burnished-gold/40 transition-colors group-hover:text-burnished-gold"
                    aria-hidden
                  >
                    image
                  </span>
                  <p className="mt-4 font-label-sm text-xs tracking-widest text-burnished-gold/60 uppercase transition-colors group-hover:text-burnished-gold/80">
                    L&apos;enluminure de couverture
                  </p>
                  <p className="mt-2 font-label-sm text-[10px] tracking-wider text-outline uppercase">
                    Cliquez pour choisir une image
                  </p>
                </>
              )}
            </button>
          </div>

          {displayedCoverSrc ? (
            <button
              type="button"
              onClick={handleRemoveCover}
              disabled={isFormDisabled}
              className="mb-4 flex w-full items-center justify-center gap-2 border border-error/40 bg-error/5 px-4 py-2 font-label-sm text-[10px] tracking-widest text-error uppercase transition-colors hover:border-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base" aria-hidden>
                delete
              </span>
              Supprimer l&apos;image
            </button>
          ) : null}

          {coverFileName ? (
            <p className="mb-4 font-label-sm text-[10px] tracking-wider text-burnished-gold/70 uppercase">
              Fichier sélectionné : {coverFileName}
            </p>
          ) : null}

          <div>
            <label htmlFor="cover_url" className={labelClass}>
              Ou saisir une URL
            </label>
            <input
              type="text"
              id="cover_url"
              value={cover_url}
              onChange={(e) => handleCoverUrlChange(e.target.value)}
              placeholder="https://... ou /covers/..."
              disabled={isFormDisabled}
              className={`${inputClass} font-label-sm`}
            />
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="alert_threshold" className={labelClass}>
                Seuil d&apos;alerte*
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="alert_threshold"
                value={alert_threshold}
                onChange={(e) =>
                  setAlertThreshold(filterDigitsInput(e.target.value, 6))
                }
                placeholder="2"
                disabled={isFormDisabled}
                className={`${inputClass} font-label-sm`}
              />
            </div>

            <FormToggle
              id="is_active"
              label="Visibilité du Codex"
              checked={is_active}
              onChange={setIsActive}
            />

            <FormToggle
              id="supplier_available"
              label="Disponible chez le fournisseur"
              checked={supplier_available}
              onChange={setSupplierAvailable}
            />

            {errorMessage ? (
              <p
                className="font-label text-xs tracking-wide text-error uppercase"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isFormDisabled}
                className="rpg-btn flex w-full items-center justify-center gap-3 py-4 font-headline-lg text-xl tracking-[0.3em] uppercase"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    <span>Enregistrement…</span>
                  </>
                ) : isEditMode ? (
                  "Mettre à jour le Codex"
                ) : (
                  "Enregistrer le Codex"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
