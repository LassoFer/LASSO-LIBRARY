import React, { type CSSProperties, type ReactElement } from "react";
import type { CellParameters, CellType, GridColumn } from "./Grid";
import styles from "./Grid.module.css";

export type ColumnOverride<T> = Partial<GridColumn<T>> & { hidden?: boolean };

export type BuildColumnsOptions<T extends Record<string, unknown>> = {
	order?: string[];
	overrides?: Partial<Record<string, ColumnOverride<T>>>;
	headers?: Partial<Record<string, string>>;
	tooltips?: Partial<Record<string, string>>;

	/**
	 * Header superior.
	 *
	 * Ejemplo:
	 * groups: {
	 *   sku: "Producto",
	 *   name: "Producto",
	 *   price: "Comercial",
	 *   stock: "Comercial",
	 * }
	 */
	groups?: Partial<Record<string, string>>;

	defaultType?: CellType;
	fieldFilter?: (key: string, sampleValue: unknown, row: T) => boolean;
	typeGuesser?: (key: string, sampleValue: unknown, row: T) => CellType;
};

function toTitle(s: string) {
	return s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function looksLikeDateString(v: unknown) {
	if (typeof v !== "string") return false;
	if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v)) return true;
	const t = Date.parse(v);
	return Number.isFinite(t);
}

function guessCellType(key: string, sampleValue: unknown): CellType {
	const k = key.toLowerCase();
	if (k.includes("date") || k.includes("fecha")) return "date";
	if (typeof sampleValue === "number") return "number";
	if (looksLikeDateString(sampleValue)) return "date";
	return "text";
}

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toDisplayString(v: unknown): string {
	if (v == null) return "";
	if (typeof v === "string") return v;
	if (typeof v === "number" || typeof v === "boolean") return String(v);

	try {
		return JSON.stringify(v);
	} catch {
		return String(v);
	}
}

function asNumberOrNull(raw: string): number | null {
	if (raw.trim() === "") return null;
	const n = Number(raw);
	return Number.isFinite(n) ? n : null;
}

/** Para input type="date" (YYYY-MM-DD) */
function toDateInputValue(v: unknown): string {
	if (v == null) return "";
	if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);

	if (typeof v === "string") {
		if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
		if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);

		const t = Date.parse(v);
		if (Number.isFinite(t)) return new Date(t).toISOString().slice(0, 10);

		return "";
	}

	return "";
}

function defaultView(key: string, value: unknown, type: CellType): ReactElement {
	// const style: CSSProperties = {
	// 	width: "100%",
	// 	overflow: "auto",
	// 	padding: "5px",
	// 	textAlign: "center",
	// };

	if (type === "textarea") {
		return <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{toDisplayString(value)}</span>;
	}

	if (type === "number") {
		const txt = typeof value === "number" ? value.toLocaleString() : toDisplayString(value);

		return <span className={styles.cellTextContainer}>{txt}</span>;
	}

	if (type === "date") {
		return <span className={styles.cellTextContainer}>{toDisplayString(value)}</span>;
	}

	if (Array.isArray(value)) {
		const k = key.toLowerCase();
		const looksLikeImage = k === "image_links" || k.includes("image") || k.includes("img");
		const first = value[0];
		const src = typeof first === "string" ? first : "";

		if (looksLikeImage && src) {
			return (
				<img
					src={src}
					alt={key}
					loading="lazy"
					decoding="async"
					style={{ width: "100%", height: "100%", objectFit: "contain" }}
				/>
			);
		}

		return <span className={styles.cellTextContainer}>{value.length ? `${value.length} items` : ""}</span>;
	}

	if (isRecord(value)) {
		if (key === "measuring_unit") {
			const unit = value.unit ?? "";
			const val = value.value ?? "";

			return <span className={styles.cellTextContainer}>{val || unit ? `${val} ${unit}`.trim() : ""}</span>;
		}

		const s = toDisplayString(value);
		const short = s.length > 40 ? `${s.slice(0, 40)}…` : s;

		return (
			<span className={styles.cellTextContainer} title={s}>
				{short}
			</span>
		);
	}

	if (typeof value === "boolean") {
		return <span>{value ? "Sí" : "No"}</span>;
	}

	return <span className={styles.cellTextContainer}>{toDisplayString(value)}</span>;
}

function defaultEdit(
	type: CellType,
	value: unknown,
	onChange: ((v: unknown) => void) | undefined,
	options: readonly (string | null)[] | undefined,
	placeholder?: string,
	disabled?: boolean,
): ReactElement {
	const isDisabled = Boolean(disabled);

	const style: CSSProperties = {
		width: "100%",
		height: "100%",
		resize: "none",
		borderRadius: "0px",
		padding: "0px 3px",
	};

	if (type === "textarea") {
		return (
			<textarea
				className="comex-input"
				style={style}
				disabled={isDisabled}
				defaultValue={typeof value === "string" ? value : value == null ? "" : String(value)}
				placeholder={placeholder}
				onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value)}
			/>
		);
	}

	if (type === "number") {
		return (
			<input
				style={style}
				type="number"
				className="comex-input"
				disabled={isDisabled}
				defaultValue={value == null ? "" : typeof value === "number" ? String(value) : String(value)}
				placeholder={placeholder}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(asNumberOrNull(e.target.value))}
			/>
		);
	}

	if (type === "date") {
		return (
			<input
				style={style}
				type="date"
				className="comex-input"
				disabled={isDisabled}
				defaultValue={toDateInputValue(value)}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value || null)}
			/>
		);
	}

	if (type === "select") {
		if (!options?.length) {
			return (
				<input
					style={style}
					type="text"
					className="comex-input"
					disabled={isDisabled}
					defaultValue={typeof value === "string" ? value : value == null ? "" : String(value)}
					placeholder={placeholder}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
				/>
			);
		}

		const current = value == null ? "__default__" : String(value);

		return (
			<select
				style={style}
				disabled={isDisabled}
				className="comex-input"
				defaultValue={current}
				onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value)}
			>
				<option disabled value="__default__">
					{placeholder ?? "Select an option"}
				</option>

				{options.map((opt) => {
					const optionValue = opt === null ? "null" : opt;

					return (
						<option key={optionValue} value={optionValue}>
							{optionValue}
						</option>
					);
				})}
			</select>
		);
	}

	return (
		<input
			style={style}
			type="text"
			className="comex-input"
			disabled={isDisabled}
			defaultValue={typeof value === "string" ? value : value == null ? "" : String(value)}
			placeholder={placeholder}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
		/>
	);
}

export const templateByType = <T extends Record<string, unknown>>(p: CellParameters<T>): ReactElement => {
	const { viewMode, type, column, row, value: valueProp, onChange, options, placeholder, disabled } = p;

	if (!row) return <></>;

	const key = column.key as string;
	const value = valueProp !== undefined ? valueProp : row[key];

	if (viewMode === "edit") {
		return defaultEdit(type, value, onChange, options, placeholder, disabled);
	}

	return defaultView(String(key), value, type);
};

export function buildColumnsFromRow<T extends Record<string, unknown>>(
	row: T,
	opts: BuildColumnsOptions<T> = {},
): GridColumn<T>[] {
	const {
		order,
		overrides = {},
		headers = {},
		tooltips = {},
		groups = {},
		defaultType,
		fieldFilter,
		typeGuesser,
	} = opts;

	const keys = (order?.length ? order : Object.keys(row)).filter((key) => !overrides[key]?.hidden);

	return keys
		.map((key) => {
			const sampleValue = row[key];

			if (fieldFilter && !fieldFilter(key, sampleValue, row)) return null;

			const ov = overrides[key];
			const resolvedKey = ov?.key ?? key;

			const resolvedType =
				ov?.type ??
				(typeGuesser ? typeGuesser(key, sampleValue, row) : undefined) ??
				defaultType ??
				guessCellType(key, sampleValue);

			const label = ov?.title ?? headers[key] ?? toTitle(key);

			const col: GridColumn<T> = {
				title: label,
				name: ov?.name ?? label,
				key: resolvedKey,
				tooltip: ov?.tooltip ?? tooltips[key] ?? label,
				type: resolvedType,
				notEditable: ov?.notEditable ?? false,
				columnOrder: ov?.columnOrder,
				group: ov?.group ?? groups[key],
				width: ov?.width,
				template: ov?.template ?? templateByType<T>,
			};

			return col;
		})
		.filter((c): c is GridColumn<T> => c !== null);
}
