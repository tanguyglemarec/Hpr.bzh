"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Upload, ImagePlus, Loader2, Sparkles, Check, X, AlertTriangle,
  ChevronDown, ChevronRight, Copy, Download, Filter, RotateCcw,
  Layers, Grid3x3, Globe, Star,
  FolderOpen, Trash2,
  Search, ArrowRight, ShieldCheck,
} from "lucide-react";

import {
  COLORS, FONT_DISPLAY, FONT_MONO, THEMES, PLATFORMS, RETOUCH_ISSUES,
  SITE_TYPES, VERDICT_META, SCORE_LABELS, USAGES, SITE_PROCEDES, SECTEURS,
  ETAPES, TYPES_VUE, RISQUES,
} from "@/lib/tri/constants";
import { resizeImageFile, extractExifDate } from "@/lib/tri/exif";
import { storageSave, storageLoad, storageDelete, storageListKeys } from "@/lib/tri/storage";
import {
  dayKey, formatDayFR, bestUsageFor, photoEditorialScore,
  normalizePieceKey, photoToStorable, photoFromStorable,
} from "@/lib/tri/helpers";
import { analyzeOnePhoto, generateGroupPostsFor } from "@/lib/tri/api";
import { Photo, PhotoGroup, GroupPostsState } from "@/lib/tri/types";
import type { UsageId } from "@/lib/tri/types";

// ---------------------------------------------------------------------------
// Small UI pieces
// ---------------------------------------------------------------------------
function StatItem({ label, value, color, title }: { label: string; value: number | string; color?: string; title?: string }) {
  return (
    <div className="text-center leading-tight" title={title}>
      <div className="text-lg sm:text-xl font-semibold" style={{ color: color || COLORS.textPrimary, fontFamily: FONT_MONO }}>
        {value}
      </div>
      <div className="text-xs uppercase" style={{ color: COLORS.textMuted, letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

function VerdictStamp({ verdict, size = "sm" }: { verdict?: string; size?: "sm" | "lg" }) {
  const meta = verdict ? VERDICT_META[verdict as keyof typeof VERDICT_META] : undefined;
  if (!meta) return null;
  const big = size === "lg";
  return (
    <div
      className={`absolute ${big ? "top-3 right-3 px-2.5 py-1" : "top-1.5 right-1.5 px-1.5 py-0.5"} font-bold uppercase rounded-sm select-none pointer-events-none`}
      style={{
        color: meta.color,
        border: `1.5px solid ${meta.color}`,
        background: `${meta.color}22`,
        transform: "rotate(-6deg)",
        fontFamily: FONT_DISPLAY,
        letterSpacing: "0.08em",
        fontSize: big ? "12px" : "9px",
      }}
    >
      {meta.label}
    </div>
  );
}

function FilterChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-medium px-2.5 py-1 rounded-full border transition-colors motion-reduce:transition-none"
      style={{
        borderColor: active ? color || COLORS.accent : COLORS.line,
        color: active ? color || COLORS.accent : COLORS.textMuted,
        background: active ? `${color || COLORS.accent}1a` : "transparent",
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center gap-2 py-16 rounded-lg border border-dashed"
      style={{ borderColor: COLORS.line, color: COLORS.textMuted }}
    >
      <FolderOpen size={26} style={{ color: COLORS.textMuted }} />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-32 shrink-0" style={{ color: COLORS.textMuted }}>{label}</span>
      <div className="flex-1 h-1.5 rounded overflow-hidden" style={{ background: COLORS.line }}>
        <div className="h-full" style={{ width: `${(value / 10) * 100}%`, background: COLORS.accent }} />
      </div>
      <span className="text-xs w-6 text-right" style={{ color: COLORS.textPrimary, fontFamily: FONT_MONO }}>{value}</span>
    </div>
  );
}

function Dropzone({ isDragging, onDragOver, onDragLeave, onDrop, onClick }: {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className="group cursor-pointer relative overflow-hidden flex flex-col items-center justify-center text-center gap-5 rounded-xl border transition-all motion-reduce:transition-none"
      style={{
        borderColor: isDragging ? COLORS.accent : COLORS.line,
        background: isDragging ? `${COLORS.accent}12` : `linear-gradient(145deg, ${COLORS.panel}, ${COLORS.void})`,
        minHeight: "430px",
        padding: "2rem",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)` }} />
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center border transition-transform group-hover:scale-105 motion-reduce:transition-none"
        style={{ borderColor: `${COLORS.accent}66`, background: `${COLORS.accent}14` }}
      >
        <Upload size={27} style={{ color: COLORS.accent }} />
      </div>
      <div>
        <p style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY }} className="text-2xl sm:text-3xl font-bold uppercase tracking-wide">
          Dépose ta production du jour
        </p>
        <p style={{ color: COLORS.textMuted }} className="text-sm mt-2">Glisse tes photos ici ou clique pour parcourir</p>
      </div>
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm" style={{ background: COLORS.accent, color: COLORS.void }}>
        Choisir des photos <ArrowRight size={15} />
      </span>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs" style={{ color: COLORS.textMuted }}>
        <span>JPEG · PNG · WebP</span>
        <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Images préparées localement</span>
        <span>HEIC à convertir en JPEG</span>
      </div>
    </div>
  );
}

function WorkflowStep({ number, label, detail, active, done }: {
  number: string; label: string; detail: string; active: boolean; done: boolean;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold border"
        style={{
          borderColor: done || active ? COLORS.accent : COLORS.line,
          background: done ? COLORS.accent : active ? `${COLORS.accent}1a` : "transparent",
          color: done ? COLORS.void : active ? COLORS.accent : COLORS.textMuted,
          fontFamily: FONT_MONO,
        }}
      >
        {done ? <Check size={13} /> : number}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold" style={{ color: active ? COLORS.textPrimary : COLORS.textMuted }}>{label}</span>
        <span className="hidden lg:block text-xs truncate" style={{ color: COLORS.textMuted }}>{detail}</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Photo card
// ---------------------------------------------------------------------------
function PhotoCard({ photo, onOpen, onRetry }: { photo: Photo; onOpen: (p: Photo) => void; onRetry: (p: Photo) => void }) {
  const a = photo.analysis;
  const bestUsage = bestUsageFor(a);
  const usageMeta = bestUsage ? USAGES[bestUsage] : undefined;
  return (
    <div
      onClick={() => onOpen(photo)}
      className="relative rounded-md overflow-hidden border cursor-pointer transition-transform motion-reduce:transition-none hover:-translate-y-0.5"
      style={{ borderColor: COLORS.line, background: COLORS.panel }}
    >
      <div className="relative aspect-square overflow-hidden" style={{ background: "#0d0e10" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.dataUrl}
          alt={a ? `${THEMES[a.theme]?.label || ""} — ${VERDICT_META[a.verdict]?.label || ""}` : photo.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        {photo.status === "analyzing" && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#00000090" }}>
            <Loader2 size={20} className="animate-spin" style={{ color: COLORS.accent }} />
          </div>
        )}
        {photo.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5" style={{ background: "#00000090" }}>
            <AlertTriangle size={18} style={{ color: COLORS.rouge }} />
            <span className="text-xs" style={{ color: COLORS.rouge }}>Échec</span>
            <button
              onClick={(e) => { e.stopPropagation(); onRetry(photo); }}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
              style={{ background: COLORS.rouge, color: "#fff" }}
            >
              <RotateCcw size={11} /> Réessayer
            </button>
          </div>
        )}
        {a && <VerdictStamp verdict={a.verdict} />}
        {a?.site?.type_site && a.site.type_site !== "aucun" && a.site.procede && (
          <div
            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-sm text-xs font-semibold"
            style={{ background: "#00000090", color: SITE_PROCEDES[a.site.procede]?.color || "#fff", fontFamily: FONT_MONO, fontSize: "9px" }}
            title={`Site · ${SITE_TYPES[a.site.type_site]?.label || a.site.type_site} · ${SITE_PROCEDES[a.site.procede]?.label || a.site.procede}`}
          >
            SITE
          </div>
        )}
        {a?.retouche && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
            <span className="rounded-full" style={{ width: 8, height: 8, background: COLORS[a.retouche.niveau as keyof typeof COLORS] || COLORS.textMuted }} />
            {(a.retouche.problemes || []).slice(0, 3).map((iss) => {
              const meta = RETOUCH_ISSUES[iss];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <span key={iss} title={meta.label} className="rounded-full p-0.5" style={{ background: "#00000090" }}>
                  <Icon size={10} style={{ color: "#fff" }} />
                </span>
              );
            })}
          </div>
        )}
      </div>
      {a && (
        <div className="px-2.5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs truncate" style={{ color: THEMES[a.theme]?.color || COLORS.textMuted }}>
              {THEMES[a.theme]?.label || a.theme}
            </span>
            <span className="text-xs font-semibold shrink-0 ml-1" style={{ color: usageMeta?.color || COLORS.textPrimary, fontFamily: FONT_MONO }}>
              {photoEditorialScore(photo)}
            </span>
          </div>
          {a.piece && (
            <p className="text-xs truncate mt-0.5" style={{ color: COLORS.textMuted }} title={a.piece}>{a.piece}</p>
          )}
          {usageMeta && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold rounded px-1.5 py-0.5 truncate" style={{ color: usageMeta.color, background: `${usageMeta.color}18`, fontSize: "9px" }}>
                {usageMeta.short}
              </span>
              {a.recommandation?.role_dans_serie && (
                <span className="text-xs truncate" style={{ color: COLORS.textMuted, fontSize: "9px" }}>
                  {a.recommandation.role_dans_serie.replaceAll("_", " ")}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Site web — vignette sélectionnable
// ---------------------------------------------------------------------------
function SiteThumb({ photo, icon: Icon, selected, onToggle, onOpen }: {
  photo: Photo; icon?: typeof Star; selected: boolean; onToggle: () => void; onOpen: () => void;
}) {
  return (
    <div
      className="relative rounded overflow-hidden border shrink-0"
      style={{ borderColor: selected ? COLORS.accent : COLORS.line, width: 76, height: 76 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.dataUrl} alt="" onClick={onOpen} className="w-full h-full object-cover cursor-pointer" />
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="absolute top-1 right-1 rounded flex items-center justify-center"
        style={{
          width: 18, height: 18,
          background: selected ? COLORS.accent : "#00000090",
          border: `1px solid ${selected ? COLORS.accent : "rgba(255,255,255,0.5)"}`,
        }}
        aria-label={selected ? "Retirer de la sélection site" : "Ajouter à la sélection site"}
      >
        {selected && <Check size={12} style={{ color: "#0d1114" }} />}
      </button>
      {Icon && (
        <span className="absolute bottom-1 left-1 rounded-full p-0.5" style={{ background: "#00000090" }}>
          <Icon size={10} style={{ color: "#e8c04d" }} />
        </span>
      )}
      <span
        className="absolute bottom-1 right-1 text-xs font-semibold rounded px-1"
        style={{ background: "#00000090", color: "#fff", fontFamily: FONT_MONO, fontSize: "9px" }}
      >
        {photo.analysis?.score_global}
      </span>
    </div>
  );
}

type SiteGroupEntry = { vignettes: Photo[]; realisations: Photo[] };

function SiteCoverage({ groups }: { groups: Map<string, SiteGroupEntry> }) {
  return (
    <div className="mb-5">
      <div className="flex items-end justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Couverture du futur site</p>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>Une vignette forte et plusieurs réalisations par procédé.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {Object.entries(SITE_PROCEDES).map(([id, meta]) => {
          const entry = groups.get(id) || { vignettes: [], realisations: [] };
          const hasHero = entry.vignettes.length > 0;
          const galleryCount = entry.realisations.length;
          const ready = hasHero && galleryCount >= 2;
          return (
            <div key={id} className="rounded-md border p-2.5 min-h-24 flex flex-col justify-between" style={{ borderColor: ready ? `${COLORS.vert}88` : COLORS.line, background: COLORS.panel }}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold leading-tight" style={{ color: COLORS.textPrimary }}>{meta.label}</span>
                <span className="rounded-full shrink-0" style={{ width: 7, height: 7, background: meta.color }} />
              </div>
              <div className="mt-3 space-y-1 text-xs" style={{ color: COLORS.textMuted }}>
                <div className="flex justify-between"><span>Vignette</span><span style={{ color: hasHero ? COLORS.vert : COLORS.orange }}>{hasHero ? "OK" : "À trouver"}</span></div>
                <div className="flex justify-between"><span>Galerie</span><span style={{ color: galleryCount >= 2 ? COLORS.vert : COLORS.orange }}>{galleryCount}/2 min.</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group ("lot") card
// ---------------------------------------------------------------------------
function GroupCard({ group, isOpen, onToggle, postsState, onGenerate, onCopy, copiedKey }: {
  group: PhotoGroup; isOpen: boolean; onToggle: () => void; postsState: GroupPostsState;
  onGenerate: (g: PhotoGroup) => void; onCopy: (key: string, text: string) => void; copiedKey: string | null;
}) {
  const publiableCount = group.photos.filter((p) => p.analysis?.verdict === "publier").length;
  const leadPhoto = group.photos[0];
  return (
    <div className="rounded-md border overflow-hidden" style={{ borderColor: COLORS.line, background: COLORS.panel }}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-3 text-left">
        <div className="flex -space-x-3 shrink-0">
          {group.photos.slice(0, 4).map((p, i) => (
            <div key={p.id} className="relative" style={{ zIndex: 4 - i }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.dataUrl}
                alt=""
                className="w-10 h-10 rounded object-cover border-2"
                style={{ borderColor: p.id === leadPhoto?.id ? COLORS.accent : COLORS.panel }}
              />
              {p.id === leadPhoto?.id && <Star size={9} className="absolute -top-1 -left-1" fill={COLORS.accent} style={{ color: COLORS.accent }} />}
            </div>
          ))}
          {group.photos.length > 4 && (
            <div
              className="w-10 h-10 rounded flex items-center justify-center text-xs font-semibold border-2"
              style={{ borderColor: COLORS.panel, background: COLORS.panelRaised, color: COLORS.textMuted }}
            >
              +{group.photos.length - 4}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full shrink-0" style={{ width: 8, height: 8, background: THEMES[group.theme]?.color }} />
            <span
              className="font-semibold text-sm truncate"
              style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY, letterSpacing: "0.03em" }}
            >
              SÉRIE · {group.pieceLabel || THEMES[group.theme]?.label || group.theme}
            </span>
          </div>
          <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
            <span>{formatDayFR(group.day)} · {group.photos.length} photos · {publiableCount} publiables</span>
            {!group.photos.every((p) => p.dateSource === "exif") && (
              <span
                className="px-1 rounded"
                style={{ fontSize: "9px", color: COLORS.orange, background: `${COLORS.orange}22` }}
                title="Au moins une photo de ce lot n'a pas de date EXIF — regroupement basé sur la date du fichier, potentiellement approximatif"
              >
                approx.
              </span>
            )}
          </div>
        </div>
        {isOpen ? <ChevronDown size={16} style={{ color: COLORS.textMuted }} /> : <ChevronRight size={16} style={{ color: COLORS.textMuted }} />}
      </button>

      {isOpen && (
        <div className="p-3 pt-0 border-t" style={{ borderColor: COLORS.line }}>
          <div className="mt-3 mb-2 flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
            <Star size={12} fill={COLORS.accent} style={{ color: COLORS.accent }} />
            Meilleure image de la série : {leadPhoto?.analysis?.piece || "sélection IA"} · score éditorial {leadPhoto ? photoEditorialScore(leadPhoto) : "—"}/10
          </div>
          {!postsState || postsState.status === "idle" ? (
            <button
              onClick={() => onGenerate(group)}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold"
              style={{ background: COLORS.accent, color: "#0d1114" }}
            >
              <Sparkles size={14} /> Générer les posts
            </button>
          ) : postsState.status === "loading" ? (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: COLORS.textMuted }}>
              <Loader2 size={14} className="animate-spin" /> Rédaction en cours…
            </div>
          ) : postsState.status === "error" ? (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: COLORS.rouge }}>
              <AlertTriangle size={14} /> Génération échouée
              <button
                onClick={() => onGenerate(group)}
                className="flex items-center gap-1 text-xs underline"
                style={{ color: COLORS.rouge }}
              >
                <RotateCcw size={11} /> réessayer
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {Object.entries(postsState.posts).map(([platId, post]) => {
                const meta = PLATFORMS[platId as keyof typeof PLATFORMS];
                const Icon = meta?.icon || Layers;
                const ck = `${group.key}__${platId}`;
                return (
                  <div key={platId} className="rounded p-2.5" style={{ background: COLORS.panelRaised }}>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: meta?.color || COLORS.textPrimary }}>
                        <Icon size={13} /> {meta?.label || platId}
                      </span>
                      <button
                        onClick={() => onCopy(ck, `${post.texte}\n\n${(post.hashtags || []).join(" ")}`)}
                        className="flex items-center gap-1 text-xs shrink-0"
                        style={{ color: copiedKey === ck ? COLORS.vert : COLORS.textMuted }}
                      >
                        {copiedKey === ck ? <Check size={12} /> : <Copy size={12} />} {copiedKey === ck ? "Copié" : "Copier"}
                      </button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: COLORS.textPrimary }}>{post.texte}</p>
                    <p className="text-xs mt-1.5" style={{ color: COLORS.accent }}>{(post.hashtags || []).join(" ")}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail modal
// ---------------------------------------------------------------------------
function PhotoModal({ photo, onClose, onUpdateSite }: {
  photo: Photo | null; onClose: () => void; onUpdateSite: (id: string, update: Partial<Photo["analysis"] extends null ? never : NonNullable<Photo["analysis"]>["site"]>) => void;
}) {
  if (!photo) return null;
  const a = photo.analysis;
  const site = a?.site || { procede: null, type_site: "aucun" as const, raison_site: "" };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "#000000c0" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl overflow-y-auto rounded-lg border flex flex-col md:flex-row"
        style={{ borderColor: COLORS.line, background: COLORS.panel, maxHeight: "90vh" }}
      >
        <div className="md:w-1/2 relative shrink-0" style={{ background: "#0d0e10" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.dataUrl} alt="" className="w-full h-full object-contain max-h-96 md:max-h-full" />
          {a && <VerdictStamp verdict={a.verdict} size="lg" />}
        </div>
        <div className="md:w-1/2 p-4 space-y-4 relative">
          <button onClick={onClose} className="absolute top-3 right-3" style={{ color: COLORS.textMuted }} aria-label="Fermer">
            <X size={18} />
          </button>
          {photo.status !== "done" || !a ? (
            <p style={{ color: COLORS.textMuted }} className="pr-8">
              {photo.status === "analyzing" ? "Analyse en cours…" : photo.status === "error" ? "Analyse échouée." : "Pas encore analysée."}
            </p>
          ) : (
            <>
              <div className="pr-8">
                <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Thème</span>
                <p className="font-semibold" style={{ color: THEMES[a.theme]?.color }}>{THEMES[a.theme]?.label}</p>
              </div>
              {a.piece && (
                <div>
                  <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Pièce identifiée</span>
                  <p className="text-sm mt-1" style={{ color: COLORS.textPrimary }}>{a.piece}</p>
                </div>
              )}
              <div>
                <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Date de prise</span>
                <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: COLORS.textPrimary }}>
                  {new Date(photo.captureDate || photo.lastModified).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      fontFamily: FONT_MONO, fontSize: "9px",
                      color: photo.dateSource === "exif" ? COLORS.vert : COLORS.orange,
                      background: photo.dateSource === "exif" ? `${COLORS.vert}22` : `${COLORS.orange}22`,
                    }}
                    title={photo.dateSource === "exif" ? "Date réelle de prise de vue (EXIF)" : "Date du fichier — approximative, l'EXIF n'a pas été trouvé (HEIC non converti, capture d'écran, export qui a réinitialisé la date...)"}
                  >
                    {photo.dateSource === "exif" ? "RÉELLE (EXIF)" : "APPROX. (FICHIER)"}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Potentiel par usage</span>
                <div className="space-y-1.5 mt-1.5">
                  {Object.entries(a.scores_usage || {}).map(([k, v]) => (
                    <ScoreBar key={k} label={USAGES[k as UsageId]?.label || k} value={v} />
                  ))}
                </div>
                {a.recommandation?.angle_editorial && (
                  <div className="mt-2 rounded p-2.5 border" style={{ borderColor: `${USAGES[bestUsageFor(a) as UsageId]?.color || COLORS.accent}55`, background: `${USAGES[bestUsageFor(a) as UsageId]?.color || COLORS.accent}0d` }}>
                    <span className="text-xs font-semibold" style={{ color: USAGES[bestUsageFor(a) as UsageId]?.color || COLORS.accent }}>
                      Meilleur usage · {USAGES[bestUsageFor(a) as UsageId]?.label || "À déterminer"}
                    </span>
                    <p className="text-xs mt-1" style={{ color: COLORS.textPrimary }}>{a.recommandation.angle_editorial}</p>
                  </div>
                )}
              </div>
              {a.lecture && (
                <div>
                  <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Lecture de l’image</span>
                  <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs">
                    <div className="rounded p-2" style={{ background: COLORS.panelRaised }}><span style={{ color: COLORS.textMuted }}>Secteur</span><p className="mt-0.5" style={{ color: COLORS.textPrimary }}>{SECTEURS[a.lecture.secteur as keyof typeof SECTEURS] || a.lecture.secteur || "—"}</p></div>
                    <div className="rounded p-2" style={{ background: COLORS.panelRaised }}><span style={{ color: COLORS.textMuted }}>Étape</span><p className="mt-0.5" style={{ color: COLORS.textPrimary }}>{ETAPES[a.lecture.etape] || a.lecture.etape || "—"}</p></div>
                    <div className="rounded p-2" style={{ background: COLORS.panelRaised }}><span style={{ color: COLORS.textMuted }}>Type de vue</span><p className="mt-0.5" style={{ color: COLORS.textPrimary }}>{TYPES_VUE[a.lecture.type_vue] || a.lecture.type_vue || "—"}</p></div>
                    <div className="rounded p-2" style={{ background: COLORS.panelRaised }}><span style={{ color: COLORS.textMuted }}>Transformation</span><p className="mt-0.5" style={{ color: a.lecture.transformation_visible ? COLORS.vert : COLORS.textPrimary }}>{a.lecture.transformation_visible ? "Visible" : "Peu visible"}</p></div>
                  </div>
                  {a.lecture.preuve_savoir_faire && <p className="text-xs mt-2" style={{ color: COLORS.textPrimary }}><span style={{ color: COLORS.textMuted }}>Preuve de savoir-faire :</span> {a.lecture.preuve_savoir_faire}</p>}
                  {(a.lecture.risques || []).filter((risk) => risk !== "aucun").length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(a.lecture.risques || []).filter((risk) => risk !== "aucun").map((risk) => (
                        <span key={risk} className="text-xs rounded px-1.5 py-0.5 flex items-center gap-1" style={{ color: COLORS.orange, background: `${COLORS.orange}18` }}>
                          <AlertTriangle size={10} /> {RISQUES[risk] || risk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div>
                <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Qualité intrinsèque</span>
                <div className="space-y-1.5 mt-1.5">
                  {Object.entries(a.scores || {}).map(([k, v]) => (
                    <ScoreBar key={k} label={SCORE_LABELS[k] || k} value={v} />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Retouche</span>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={{ color: "#0d1114", background: COLORS[a.retouche?.niveau as keyof typeof COLORS] || COLORS.textMuted }}
                  >
                    {(a.retouche?.niveau || "").toUpperCase()}
                  </span>
                  {(a.retouche?.problemes || []).map((iss) => {
                    const meta = RETOUCH_ISSUES[iss];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                      <span
                        key={iss}
                        title={meta.label}
                        className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                        style={{ background: COLORS.panelRaised, color: COLORS.textMuted }}
                      >
                        <Icon size={11} /> {meta.label}
                      </span>
                    );
                  })}
                  {(!a.retouche?.problemes || a.retouche.problemes.length === 0) && (
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>Rien à signaler</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Légende suggérée</span>
                <p className="text-sm mt-1" style={{ color: COLORS.textPrimary }}>{a.legende}</p>
              </div>
              <div>
                <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Raison du verdict</span>
                <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{a.raison}</p>
              </div>
              <div>
                <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Plateformes</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(a.plateformes || []).map((pl) => {
                    const meta = PLATFORMS[pl];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                      <span
                        key={pl}
                        className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                        style={{ color: meta.color, background: `${meta.color}1a` }}
                      >
                        <Icon size={11} /> {meta.label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="rounded p-3" style={{ background: COLORS.panelRaised }}>
                <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Site web — correction manuelle</span>
                {a.site?.raison_site && (
                  <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{a.site.raison_site}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <select
                    value={site.procede || ""}
                    onChange={(e) => onUpdateSite(photo.id, { procede: (e.target.value || null) as never, type_site: (e.target.value ? (site.type_site === "aucun" ? "realisation" : site.type_site) : "aucun") as never })}
                    className="text-xs rounded px-2 py-1 border bg-transparent"
                    style={{ borderColor: COLORS.line, color: COLORS.textPrimary }}
                  >
                    <option value="" style={{ color: "#000" }}>Aucun procédé</option>
                    {Object.entries(SITE_PROCEDES).map(([id, s]) => (
                      <option key={id} value={id} style={{ color: "#000" }}>{s.label}</option>
                    ))}
                  </select>
                  <select
                    value={site.type_site || "aucun"}
                    onChange={(e) => onUpdateSite(photo.id, { procede: site.procede as never, type_site: e.target.value as never })}
                    disabled={!site.procede}
                    className="text-xs rounded px-2 py-1 border bg-transparent disabled:opacity-40"
                    style={{ borderColor: COLORS.line, color: COLORS.textPrimary }}
                  >
                    <option value="aucun" style={{ color: "#000" }}>Pas pour le site</option>
                    <option value="vignette" style={{ color: "#000" }}>Vignette (accueil)</option>
                    <option value="realisation" style={{ color: "#000" }}>Réalisation (galerie)</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PhotoTriApp() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importWarning, setImportWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const [view, setView] = useState<"galerie" | "dossiers" | "site">("galerie");
  const [filterVerdict, setFilterVerdict] = useState("tous");
  const [filterTheme, setFilterTheme] = useState("tous");
  const [filterUsage, setFilterUsage] = useState("tous");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());
  const [groupPosts, setGroupPosts] = useState<Record<string, GroupPostsState>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [siteSelections, setSiteSelections] = useState<Set<string>>(() => new Set());
  const siteInitialized = useRef<Set<string>>(new Set());

  const [isRestoring, setIsRestoring] = useState(true);
  const importCounter = useRef(0);
  const restoreDone = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const keys = await storageListKeys("photo:");
        if (keys.length) {
          const restored: Photo[] = [];
          for (const key of keys) {
            const stored = await storageLoad<Photo>(key);
            if (stored) restored.push(photoFromStorable(stored));
          }
          restored.sort((a, b) => (a.importOrder ?? 0) - (b.importOrder ?? 0));
          importCounter.current = restored.reduce((max, p) => Math.max(max, (p.importOrder ?? 0) + 1), 0);
          if (restored.length) {
            setPhotos(restored);
            setImportWarning(`${restored.length} photo(s) restaurée(s) de ta dernière session.`);
          }
        }
        const state = await storageLoad<{ groupPosts?: Record<string, GroupPostsState>; siteSelections?: string[]; openGroups?: string[] }>("hpr-tri:app-state");
        if (state) {
          if (state.groupPosts) setGroupPosts(state.groupPosts);
          if (state.siteSelections) setSiteSelections(new Set(state.siteSelections));
          if (state.openGroups) setOpenGroups(new Set(state.openGroups));
        }
      } catch {
        // best-effort — pas de session précédente à restaurer, ou stockage indisponible
      } finally {
        restoreDone.current = true;
        setIsRestoring(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!restoreDone.current) return undefined;
    const t = setTimeout(() => {
      storageSave("hpr-tri:app-state", {
        groupPosts,
        siteSelections: Array.from(siteSelections),
        openGroups: Array.from(openGroups),
      });
    }, 600);
    return () => clearTimeout(t);
  }, [groupPosts, siteSelections, openGroups]);

  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).filter(
      (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name),
    );
    if (!files.length) return;

    setImportWarning(null);
    setImportProgress({ done: 0, total: files.length });

    const IMPORT_CONCURRENCY = 4;
    let index = 0;
    let doneCount = 0;
    const failedNames: string[] = [];

    async function worker() {
      while (index < files.length) {
        const file = files[index];
        index += 1;
        try {
          const [{ dataUrl, base64, mediaType }, exifTs] = await Promise.all([
            resizeImageFile(file),
            extractExifDate(file),
          ]);
          const photo: Photo = {
            id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            lastModified: file.lastModified || Date.now(),
            captureDate: exifTs,
            dateSource: exifTs ? "exif" : "fichier",
            importOrder: importCounter.current++,
            dataUrl,
            base64,
            mediaType,
            status: "pending",
            error: null,
            analysis: null,
          };
          setPhotos((prev) => [...prev, photo]);
          storageSave(`photo:${photo.id}`, photoToStorable(photo));
        } catch {
          failedNames.push(file.name);
        } finally {
          doneCount += 1;
          setImportProgress({ done: doneCount, total: files.length });
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(IMPORT_CONCURRENCY, files.length) }, worker));
    setImportProgress(null);

    const notes: string[] = [];
    if (failedNames.length) {
      notes.push(`${failedNames.length} photo(s) non chargée(s) — probablement au format HEIC. Exporte-les en JPEG depuis l'app Photos (Fichier → Exporter) et réimporte.`);
    }
    if (files.length > 80) {
      notes.push(`${files.length} photos importées d'un coup — pour l'analyse IA qui suit, mieux vaut lancer par lots de 30-50 plutôt que tout d'un coup.`);
    }
    if (notes.length) setImportWarning(notes.join(" "));
  }, []);

  const analyzeAll = useCallback(async () => {
    const toAnalyze = photos.filter((p) => p.status === "pending" || p.status === "error");
    if (!toAnalyze.length) return;
    setIsAnalyzing(true);
    setProgress({ done: 0, total: toAnalyze.length });
    setPhotos((prev) => prev.map((p) => (toAnalyze.find((t) => t.id === p.id) ? { ...p, status: "analyzing" } : p)));

    const CONCURRENCY = 5;
    let index = 0;
    let doneCount = 0;

    async function worker() {
      while (index < toAnalyze.length) {
        const current = toAnalyze[index];
        index += 1;
        try {
          const analysis = await analyzeOnePhoto(current);
          const updated: Photo = { ...current, status: "done", analysis, error: null };
          setPhotos((prev) => prev.map((p) => (p.id === current.id ? updated : p)));
          storageSave(`photo:${current.id}`, photoToStorable(updated));
        } catch {
          setPhotos((prev) => prev.map((p) => (p.id === current.id ? { ...p, status: "error", error: "Analyse échouée" } : p)));
        } finally {
          doneCount += 1;
          setProgress({ done: doneCount, total: toAnalyze.length });
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, toAnalyze.length) }, worker));
    setIsAnalyzing(false);
  }, [photos]);

  const retryOne = useCallback(async (photo: Photo) => {
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: "analyzing", error: null } : p)));
    try {
      const analysis = await analyzeOnePhoto(photo);
      const updated: Photo = { ...photo, status: "done", analysis, error: null };
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updated : p)));
      storageSave(`photo:${photo.id}`, photoToStorable(updated));
    } catch {
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: "error", error: "Analyse échouée" } : p)));
    }
  }, []);

  const groups = useMemo<PhotoGroup[]>(() => {
    const map = new Map<string, PhotoGroup>();
    photos
      .filter((p) => p.status === "done" && p.analysis)
      .forEach((p) => {
        const day = dayKey(p.captureDate || p.lastModified);
        const pieceKey = normalizePieceKey(p.analysis!.piece, p.analysis!.theme);
        const key = `${day}__${pieceKey}`;
        if (!map.has(key)) {
          map.set(key, { key, day, theme: p.analysis!.theme, pieceLabel: p.analysis!.piece, photos: [] });
        }
        map.get(key)!.photos.push(p);
      });
    return Array.from(map.values())
      .map((group) => ({ ...group, photos: [...group.photos].sort((a, b) => photoEditorialScore(b) - photoEditorialScore(a)) }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));
  }, [photos]);

  const handleGeneratePosts = useCallback(async (group: PhotoGroup) => {
    setGroupPosts((prev) => ({ ...prev, [group.key]: { status: "loading", posts: null } }));
    try {
      const posts = await generateGroupPostsFor(group);
      setGroupPosts((prev) => ({ ...prev, [group.key]: { status: "done", posts } }));
    } catch {
      setGroupPosts((prev) => ({ ...prev, [group.key]: { status: "error", posts: null } }));
    }
  }, []);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    const toAdd: string[] = [];
    photos.forEach((p) => {
      const s = p.analysis?.site;
      if (p.status === "done" && s && s.type_site && s.type_site !== "aucun" && s.procede && !siteInitialized.current.has(p.id)) {
        siteInitialized.current.add(p.id);
        toAdd.push(p.id);
      }
    });
    if (toAdd.length) {
      setSiteSelections((prev) => {
        const next = new Set(prev);
        toAdd.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [photos]);

  const toggleSiteSelection = (id: string) => {
    setSiteSelections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        const target = photos.find((p) => p.id === id);
        if (target?.analysis?.site?.type_site === "vignette" && target.analysis.site.procede) {
          photos.forEach((p) => {
            if (p.id !== id && p.analysis?.site?.type_site === "vignette" && p.analysis.site.procede === target.analysis!.site.procede) {
              next.delete(p.id);
            }
          });
        }
        next.add(id);
      }
      return next;
    });
  };

  const updateSiteTag = useCallback((id: string, siteUpdate: Partial<NonNullable<Photo["analysis"]>["site"]>) => {
    siteInitialized.current.add(id);
    setPhotos((prev) => prev.map((p) => {
      if (p.id !== id || !p.analysis) return p;
      const updated: Photo = { ...p, analysis: { ...p.analysis, site: { ...p.analysis.site, ...siteUpdate } } };
      storageSave(`photo:${id}`, photoToStorable(updated));
      return updated;
    }));
    setSelectedPhoto((prev) => (prev?.id === id && prev.analysis
      ? { ...prev, analysis: { ...prev.analysis, site: { ...prev.analysis.site, ...siteUpdate } } }
      : prev));
    setSiteSelections((prev) => {
      const next = new Set(prev);
      if (siteUpdate.type_site && siteUpdate.type_site !== "aucun" && siteUpdate.procede) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const siteGroups = useMemo(() => {
    const map = new Map<string, SiteGroupEntry>();
    Object.keys(SITE_PROCEDES).forEach((id) => map.set(id, { vignettes: [], realisations: [] }));
    photos.forEach((p) => {
      const s = p.analysis?.site;
      if (p.status === "done" && s?.procede && map.has(s.procede)) {
        if (s.type_site === "vignette") map.get(s.procede)!.vignettes.push(p);
        else if (s.type_site === "realisation") map.get(s.procede)!.realisations.push(p);
      }
    });
    map.forEach((entry) => {
      entry.vignettes.sort((a, b) => (b.analysis?.score_global ?? 0) - (a.analysis?.score_global ?? 0));
      entry.realisations.sort((a, b) => (b.analysis?.score_global ?? 0) - (a.analysis?.score_global ?? 0));
    });
    return map;
  }, [photos]);

  function downloadSiteSelection() {
    const selected = photos.filter((p) => siteSelections.has(p.id) && p.analysis?.site?.procede);
    const counters: Record<string, number> = {};
    selected.forEach((p) => {
      const { procede, type_site } = p.analysis!.site;
      const key = `${procede}-${type_site}`;
      counters[key] = (counters[key] || 0) + 1;
      const suffix = type_site === "vignette" ? "" : `-${counters[key]}`;
      const a = document.createElement("a");
      a.href = p.dataUrl;
      a.download = `site-${procede}-${type_site}${suffix}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  const stats = useMemo(() => {
    const analyzed = photos.filter((p) => p.status === "done");
    const publiable = analyzed.filter((p) => p.analysis?.verdict === "publier").length;
    const siteCandidats = analyzed.filter((p) => p.analysis?.site?.type_site && p.analysis.site.type_site !== "aucun" && p.analysis.site.procede).length;
    return { total: photos.length, analyzed: analyzed.length, publiable, groupsCount: groups.length, siteCandidats };
  }, [photos, groups]);

  const filteredPhotos = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = photos.filter((p) => {
      if (filterVerdict !== "tous") {
        if (filterVerdict === "non_analyse") {
          if (p.status === "done") return false;
        } else if (p.analysis?.verdict !== filterVerdict) return false;
      }
      if (filterTheme !== "tous" && p.analysis?.theme !== filterTheme) return false;
      if (filterUsage !== "tous" && bestUsageFor(p.analysis) !== filterUsage) return false;
      if (q) {
        const haystack = [
          p.analysis?.piece, p.analysis?.legende, p.analysis ? THEMES[p.analysis.theme]?.label : null, p.name,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    if (sortBy === "score") {
      return [...list].sort((a, b) => (b.analysis?.score_global ?? -1) - (a.analysis?.score_global ?? -1));
    }
    if (sortBy === "ancien") {
      return [...list].sort((a, b) => (a.captureDate || a.lastModified) - (b.captureDate || b.lastModified));
    }
    if (sortBy === "recent") {
      return [...list].sort((a, b) => (b.captureDate || b.lastModified) - (a.captureDate || a.lastModified));
    }
    return list;
  }, [photos, filterVerdict, filterTheme, filterUsage, searchText, sortBy]);

  function copyText(key: string, text: string) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
      });
    }
  }

  function exportSummary() {
    let out = `HPR — Export tri photos — ${new Date().toLocaleDateString("fr-FR")}\n\n`;
    groups.forEach((g) => {
      const gp = groupPosts[g.key];
      out += `=== LOT · ${THEMES[g.theme]?.label || g.theme} · ${formatDayFR(g.day)} (${g.photos.length} photos) ===\n`;
      if (gp?.status === "done" && gp.posts) {
        Object.entries(gp.posts).forEach(([plat, post]) => {
          out += `\n-- ${PLATFORMS[plat as keyof typeof PLATFORMS]?.label || plat} --\n${post.texte}\n${(post.hashtags || []).join(" ")}\n`;
        });
      } else {
        out += "(posts non générés)\n";
      }
      out += "\n\n";
    });
    const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hpr-posts-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (!selectedPhoto) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedPhoto(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPhoto]);

  const pendingOrErrorCount = photos.filter((p) => p.status === "pending" || p.status === "error").length;

  return (
    <div className="min-h-screen w-full" style={{ background: COLORS.void, color: COLORS.textPrimary, fontFamily: FONT_MONO }}>
      <style>{`
        *:focus-visible { outline: 2px solid ${COLORS.accent}; outline-offset: 2px; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${COLORS.void}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.line}; border-radius: 4px; }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />

      <header
        className="border-b sticky top-0 z-10"
        style={{ borderColor: COLORS.line, background: `${COLORS.panel}f2`, backdropFilter: "blur(6px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded flex items-center justify-center border" style={{ borderColor: COLORS.line, background: COLORS.void }}>
              <span className="font-extrabold text-lg" style={{ fontFamily: FONT_DISPLAY, color: COLORS.accent }}>H</span>
            </div>
            <div>
              <h1
                style={{ fontFamily: FONT_DISPLAY, color: COLORS.textPrimary }}
                className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide leading-none"
              >
                Tri de production
              </h1>
              <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">
                HPR · Sélection éditoriale assistée
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 sm:gap-6">
            <StatItem label="photos" value={stats.total} />
            <StatItem label="analysées" value={stats.analyzed} />
            <StatItem label="publiables" value={stats.publiable} color={COLORS.vert} />
            <StatItem label="lots" value={stats.groupsCount} />
            <StatItem label="candidats site" value={stats.siteCandidats} color={COLORS.accent} title="Photos taguées pour le site web" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-3 gap-3 mb-5 rounded-lg border p-3" style={{ borderColor: COLORS.line, background: COLORS.panel }}>
          <WorkflowStep number="1" label="Importer" detail="Photos de l'atelier" active={photos.length === 0} done={photos.length > 0} />
          <WorkflowStep number="2" label="Analyser" detail="Qualité, thème et usage" active={photos.length > 0 && stats.analyzed < photos.length} done={photos.length > 0 && stats.analyzed === photos.length} />
          <WorkflowStep number="3" label="Sélectionner" detail="Réseaux et site web" active={stats.analyzed > 0} done={false} />
        </div>
        {importWarning && (
          <div
            className="mb-4 flex items-start gap-2 text-sm rounded-md p-3 border"
            style={{ borderColor: COLORS.orange, background: `${COLORS.orange}14`, color: COLORS.orange }}
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p className="flex-1">{importWarning}</p>
            <button onClick={() => setImportWarning(null)} aria-label="Fermer l'avertissement">
              <X size={14} />
            </button>
          </div>
        )}

        {isRestoring ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed"
            style={{ borderColor: COLORS.line, background: COLORS.panel, minHeight: "360px" }}
          >
            <Loader2 size={28} className="animate-spin" style={{ color: COLORS.accent }} />
            <p className="text-sm" style={{ color: COLORS.textMuted }}>Vérification d&apos;une session précédente…</p>
          </div>
        ) : photos.length === 0 ? (
          <Dropzone
            isDragging={isDragging}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 rounded-lg border p-2" style={{ borderColor: COLORS.line, background: COLORS.panel }}>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!importProgress}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium border disabled:opacity-40"
                  style={{ borderColor: COLORS.line, color: COLORS.textPrimary }}
                >
                  {importProgress ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                  {importProgress ? `Import ${importProgress.done}/${importProgress.total}` : "Ajouter"}
                </button>
                <button
                  onClick={analyzeAll}
                  disabled={isAnalyzing || pendingOrErrorCount === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold disabled:opacity-40 transition-transform active:scale-[0.98] motion-reduce:transition-none"
                  style={{ background: COLORS.accent, color: "#0d1114", boxShadow: pendingOrErrorCount > 0 ? `0 0 0 3px ${COLORS.accent}20` : "none" }}
                >
                  {isAnalyzing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {isAnalyzing ? `Analyse ${progress.done}/${progress.total}` : `Analyser (${pendingOrErrorCount})`}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Effacer toutes les photos importées ? (y compris la sauvegarde automatique)")) {
                      (async () => {
                        try {
                          const keys = await storageListKeys("photo:");
                          await Promise.all(keys.map((k) => storageDelete(k)));
                          await storageDelete("hpr-tri:app-state");
                        } catch {
                          // best-effort
                        }
                      })();
                      setPhotos([]);
                      setGroupPosts({});
                      setOpenGroups(new Set());
                      setImportWarning(null);
                      setSiteSelections(new Set());
                      siteInitialized.current = new Set();
                      importCounter.current = 0;
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm border"
                  style={{ borderColor: COLORS.line, color: COLORS.textMuted }}
                >
                  <Trash2 size={14} /> Réinitialiser
                </button>
              </div>
              <div className="flex rounded overflow-hidden border" style={{ borderColor: COLORS.line }}>
                <button
                  onClick={() => setView("galerie")}
                  className="px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
                  style={{
                    background: view === "galerie" ? COLORS.panelRaised : "transparent",
                    color: view === "galerie" ? COLORS.textPrimary : COLORS.textMuted,
                  }}
                >
                  <Grid3x3 size={14} /> Galerie
                </button>
                <button
                  onClick={() => setView("dossiers")}
                  className="px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
                  style={{
                    background: view === "dossiers" ? COLORS.panelRaised : "transparent",
                    color: view === "dossiers" ? COLORS.textPrimary : COLORS.textMuted,
                  }}
                >
                  <Layers size={14} /> Séries ({groups.length})
                </button>
                <button
                  onClick={() => setView("site")}
                  className="px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
                  style={{
                    background: view === "site" ? COLORS.panelRaised : "transparent",
                    color: view === "site" ? COLORS.textPrimary : COLORS.textMuted,
                  }}
                >
                  <Globe size={14} /> Site ({stats.siteCandidats})
                </button>
              </div>
            </div>

            {importProgress && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
                  <span>Import {importProgress.done}/{importProgress.total}…</span>
                </div>
                <div className="h-1 w-full rounded overflow-hidden" style={{ background: COLORS.line }}>
                  <div
                    className="h-full transition-all motion-reduce:transition-none"
                    style={{ width: `${(importProgress.done / Math.max(importProgress.total, 1)) * 100}%`, background: COLORS.orange }}
                  />
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="mb-4 h-1 w-full rounded overflow-hidden" style={{ background: COLORS.line }}>
                <div
                  className="h-full transition-all motion-reduce:transition-none"
                  style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%`, background: COLORS.accent }}
                />
              </div>
            )}

            {view === "galerie" ? (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <label className="relative flex-1" style={{ minWidth: "220px" }}>
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.textMuted }} />
                    <span className="sr-only">Rechercher dans les photos</span>
                    <input
                      type="search"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Chercher une pièce, un thème, une légende…"
                      className="w-full text-xs rounded-md pl-9 pr-3 py-2 border bg-transparent"
                      style={{ borderColor: COLORS.line, color: COLORS.textPrimary }}
                    />
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs rounded px-2 py-1.5 border bg-transparent"
                    style={{ borderColor: COLORS.line, color: COLORS.textMuted }}
                  >
                    <option value="recent" style={{ color: "#000" }}>Plus récentes d&apos;abord</option>
                    <option value="ancien" style={{ color: "#000" }}>Plus anciennes d&apos;abord</option>
                    <option value="score" style={{ color: "#000" }}>Meilleur score d&apos;abord</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Filter size={14} style={{ color: COLORS.textMuted }} />
                  <FilterChip active={filterVerdict === "tous"} onClick={() => setFilterVerdict("tous")} label="Tous" />
                  <FilterChip active={filterVerdict === "publier"} onClick={() => setFilterVerdict("publier")} label="Publier" color={COLORS.vert} />
                  <FilterChip active={filterVerdict === "peut_etre"} onClick={() => setFilterVerdict("peut_etre")} label="Peut-être" color={COLORS.orange} />
                  <FilterChip active={filterVerdict === "eviter"} onClick={() => setFilterVerdict("eviter")} label="Éviter" color={COLORS.rouge} />
                  <FilterChip active={filterVerdict === "non_analyse"} onClick={() => setFilterVerdict("non_analyse")} label="Non analysées" />
                  <span className="w-px h-4" style={{ background: COLORS.line }} />
                  <select
                    value={filterTheme}
                    onChange={(e) => setFilterTheme(e.target.value)}
                    className="text-xs rounded px-2 py-1 border bg-transparent"
                    style={{ borderColor: COLORS.line, color: COLORS.textMuted }}
                  >
                    <option value="tous">Tous les thèmes</option>
                    {Object.entries(THEMES).map(([id, t]) => (
                      <option key={id} value={id} style={{ color: "#000" }}>{t.label}</option>
                    ))}
                  </select>
                  <select
                    value={filterUsage}
                    onChange={(e) => setFilterUsage(e.target.value)}
                    className="text-xs rounded px-2 py-1 border bg-transparent"
                    style={{ borderColor: COLORS.line, color: COLORS.textMuted }}
                    aria-label="Filtrer par meilleur usage"
                  >
                    <option value="tous">Tous les usages</option>
                    {Object.entries(USAGES).map(([id, usage]) => (
                      <option key={id} value={id} style={{ color: "#000" }}>{usage.label}</option>
                    ))}
                  </select>
                </div>

                {filteredPhotos.length === 0 ? (
                  <EmptyState text="Aucune photo pour ce filtre." />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredPhotos.map((p) => (
                      <PhotoCard key={p.id} photo={p} onOpen={setSelectedPhoto} onRetry={retryOne} />
                    ))}
                  </div>
                )}
              </>
            ) : view === "dossiers" ? (
              <>
                <div className="flex items-center justify-between mb-3 gap-3">
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Regroupées par date et pièce détectée · la meilleure vue est placée en premier</p>
                  <button
                    onClick={exportSummary}
                    disabled={groups.length === 0}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border disabled:opacity-40"
                    style={{ borderColor: COLORS.line, color: COLORS.textMuted }}
                  >
                    <Download size={13} /> Exporter
                  </button>
                </div>
                {groups.length === 0 ? (
                  <EmptyState text="Analyse tes photos pour voir apparaître les lots." />
                ) : (
                  <div className="space-y-3">
                    {groups.map((g) => (
                      <GroupCard
                        key={g.key}
                        group={g}
                        isOpen={openGroups.has(g.key)}
                        onToggle={() => toggleGroup(g.key)}
                        postsState={groupPosts[g.key] || { status: "idle", posts: null }}
                        onGenerate={handleGeneratePosts}
                        onCopy={copyText}
                        copiedKey={copiedKey}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <SiteCoverage groups={siteGroups} />
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <p className="text-xs max-w-md" style={{ color: COLORS.textMuted }}>
                    Regroupées par procédé — une vignette (page d&apos;accueil) + des réalisations (galerie du procédé) par carte. Décoche ce que tu ne veux pas exporter.
                  </p>
                  <button
                    onClick={downloadSiteSelection}
                    disabled={siteSelections.size === 0}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded font-semibold disabled:opacity-40"
                    style={{ background: COLORS.accent, color: "#0d1114" }}
                  >
                    <Download size={13} /> Télécharger la sélection ({siteSelections.size})
                  </button>
                </div>
                {stats.siteCandidats === 0 ? (
                  <EmptyState text="Analyse tes photos pour voir apparaître les candidats site, classés par procédé." />
                ) : (
                  <div className="space-y-4">
                    {Object.entries(SITE_PROCEDES).map(([procId, procMeta]) => {
                      const entry = siteGroups.get(procId);
                      if (!entry || (entry.vignettes.length === 0 && entry.realisations.length === 0)) return null;
                      return (
                        <div key={procId} className="rounded-md border p-3" style={{ borderColor: COLORS.line, background: COLORS.panel }}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="rounded-full" style={{ width: 8, height: 8, background: procMeta.color }} />
                            <span className="font-semibold text-sm" style={{ color: COLORS.textPrimary, fontFamily: FONT_DISPLAY, letterSpacing: "0.03em" }}>
                              {procMeta.label.toUpperCase()}
                            </span>
                          </div>

                          {entry.vignettes.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs uppercase mb-1.5" style={{ color: COLORS.textMuted, letterSpacing: "0.06em" }}>
                                Vignette — accueil {entry.vignettes.length > 1 && `(${entry.vignettes.length} candidates, choisis-en une)`}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {entry.vignettes.map((p) => (
                                  <SiteThumb key={p.id} photo={p} icon={Star} selected={siteSelections.has(p.id)} onToggle={() => toggleSiteSelection(p.id)} onOpen={() => setSelectedPhoto(p)} />
                                ))}
                              </div>
                            </div>
                          )}

                          {entry.realisations.length > 0 && (
                            <div>
                              <p className="text-xs uppercase mb-1.5" style={{ color: COLORS.textMuted, letterSpacing: "0.06em" }}>
                                Réalisations — galerie ({entry.realisations.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {entry.realisations.map((p) => (
                                  <SiteThumb key={p.id} photo={p} selected={siteSelections.has(p.id)} onToggle={() => toggleSiteSelection(p.id)} onOpen={() => setSelectedPhoto(p)} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} onUpdateSite={updateSiteTag} />

      <div className="text-center text-xs py-4" style={{ color: COLORS.textMuted }}>
        Sauvegarde automatique activée — tu peux changer d&apos;appli sans perdre ta session. Seul un « Réinitialiser » volontaire efface tout.
      </div>
    </div>
  );
}
