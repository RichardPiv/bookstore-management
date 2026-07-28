"use client";

import { AuthorPublic } from "@/services/authors/types";

import BookFormSelect from "./BookFormSelect";

type BookFormAuthorsFieldProps = {
  id?: string;
  authorIds: number[];
  authors: AuthorPublic[];
  disabled?: boolean;
  onChange: (authorIds: number[]) => void;
};

export default function BookFormAuthorsField({
  id = "author_ids",
  authorIds,
  authors,
  disabled = false,
  onChange,
}: BookFormAuthorsFieldProps) {
  const selectedAuthors = authorIds
    .map((authorId) => authors.find((author) => author.id === authorId))
    .filter((author): author is AuthorPublic => author !== undefined);

  const availableAuthors = authors.filter(
    (author) => !authorIds.includes(author.id),
  );

  function addAuthor(value: string) {
    if (!value) {
      return;
    }

    const authorId = Number(value);
    if (!authorIds.includes(authorId)) {
      onChange([...authorIds, authorId]);
    }
  }

  function removeAuthor(authorId: number) {
    onChange(authorIds.filter((id) => id !== authorId));
  }

  return (
    <div className="book-form-authors-field">
      {selectedAuthors.map((author) => (
        <span key={author.id} className="book-form-authors-chip">
          <span>{author.name}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => removeAuthor(author.id)}
            className="book-form-authors-chip-remove"
            aria-label={`Retirer ${author.name}`}
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden>
              close
            </span>
          </button>
        </span>
      ))}

      {availableAuthors.length > 0 ? (
        <div className="book-form-authors-picker">
          <BookFormSelect
            id={`${id}-picker`}
            value=""
            onChange={addAuthor}
            placeholder="Ajouter un auteur..."
            disabled={disabled}
            options={availableAuthors.map((author) => ({
              value: String(author.id),
              label: author.name,
            }))}
          />
        </div>
      ) : authorIds.length === 0 ? (
        <p className="px-2 py-1 font-body-md text-sm text-outline/70 italic">
          Aucun auteur disponible
        </p>
      ) : null}
    </div>
  );
}
