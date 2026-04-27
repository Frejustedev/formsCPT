import Link from 'next/link';
import {
  Download,
  Activity,
  Shield,
  FileText,
  Smartphone,
  Clock,
  Save,
  Github,
  ChevronDown,
  ArrowRight,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { NativeRedirect } from '@/components/NativeRedirect';

export const dynamic = 'force-static';

const RELEASE_TAG = 'v1.0.0';
const RELEASE_BASE = `https://github.com/Frejustedev/formsCPT/releases/download/${RELEASE_TAG}`;
const WIN_URL = `${RELEASE_BASE}/RegistreCDT-1.0.0-portable.exe`;
const ANDROID_URL = `${RELEASE_BASE}/RegistreCDT-1.0.0-android.apk`;
const REPO_URL = 'https://github.com/Frejustedev/formsCPT';

function WindowsIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M0 3.5l9.7-1.3v9.7H0V3.5zm10.7-1.5L24 0v11.5H10.7V2zM0 12.7h9.7v9.7L0 21V12.7zm10.7 0H24V24l-13.3-1.8V12.7z" />
    </svg>
  );
}

function AndroidIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.523 15.341c-.6 0-1.084-.483-1.084-1.082s.484-1.083 1.084-1.083 1.083.484 1.083 1.083-.484 1.082-1.083 1.082m-11.046 0c-.6 0-1.084-.483-1.084-1.082s.484-1.083 1.084-1.083 1.083.484 1.083 1.083-.484 1.082-1.083 1.082m11.434-6.024l2.165-3.747a.45.45 0 0 0-.165-.614.452.452 0 0 0-.614.164l-2.193 3.797c-1.677-.766-3.554-1.193-5.604-1.193s-3.927.427-5.604 1.193l-2.193-3.797a.452.452 0 0 0-.614-.164.45.45 0 0 0-.165.614l2.165 3.747C1.499 11.137 0 13.972 0 17.235h24c0-3.263-1.499-6.098-6.089-7.918" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className="bg-white text-slate-900">
      <NativeRedirect />
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Activity className="w-4 h-4" />
            </span>
            Registre CDT
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition">Fonctionnalités</a>
            <a href="#downloads" className="hover:text-slate-900 transition">Télécharger</a>
            <a href="#faq" className="hover:text-slate-900 transition">FAQ</a>
            <Link href="/app/" className="hover:text-slate-900 transition">Démo en ligne</Link>
          </nav>
          <a
            href="#downloads"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold shadow-sm hover:bg-slate-700 transition"
          >
            <Download className="w-4 h-4" />
            Télécharger
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(99, 102, 241, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.08) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="absolute -top-40 -right-32 w-[500px] h-[500px] rounded-full bg-blue-300 blur-[100px] opacity-40 pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-300 blur-[100px] opacity-40 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              v1.0.0 disponible · Windows + Android
            </span>
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Le suivi du{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                cancer thyroïdien
              </span>{' '}
              entièrement{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                hors-ligne
              </span>
              .
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              38 champs alignés sur la <strong>Fiche Guide CDT</strong>, choix prédéfinis, exports Excel et
              PDF. Vos données restent sur votre poste — aucune connexion requise, aucun compte cloud.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={WIN_URL}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all"
              >
                <WindowsIcon className="w-5 h-5" />
                Windows
                <span className="text-xs font-normal opacity-80">132 MB</span>
              </a>
              <a
                href={ANDROID_URL}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
              >
                <AndroidIcon className="w-5 h-5" />
                Android (APK)
                <span className="text-xs font-normal opacity-80">8 MB</span>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 pt-2">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                Aucune installation
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                100 % gratuit
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                Open source
              </span>
            </div>
          </div>

          {/* App preview */}
          <div className="relative animate-float">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 blur-2xl opacity-20" />
            <div className="relative rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 bg-white overflow-hidden">
              <div className="h-9 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 px-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-slate-500 font-medium">Registre CDT</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-slate-900">Tableau de bord</div>
                    <div className="text-xs text-slate-500">142 patients suivis</div>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold">
                    + Nouveau dossier
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Total patients</div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">142</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Sexe (F / M)</div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">98 / 44</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Variante principale</div>
                    <div className="text-sm font-bold text-slate-900">CPT (78 %)</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Âge moyen Dgc</div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">42 ans</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Vésiculaire', count: 42, pct: 68 },
                    { name: 'Oncocytaire', count: 21, pct: 35 },
                    { name: 'NIFTP', count: 11, pct: 18 },
                  ].map((v) => (
                    <div key={v.name} className="flex items-center gap-3 text-xs">
                      <span className="w-24 truncate text-slate-600">{v.name}</span>
                      <div className="flex-1 bg-slate-100 rounded h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded" style={{ width: `${v.pct}%` }} />
                      </div>
                      <span className="tabular-nums w-6 text-right text-slate-700">{v.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-200 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: '38', l: 'champs prédéfinis' },
            { v: '100 %', l: 'local, hors-ligne' },
            { v: '3', l: 'plateformes' },
            { v: '0 €', l: 'aucun coût' },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">{s.v}</div>
              <div className="text-sm text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
              Fonctionnalités
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-4 tracking-tight">
              Tout ce qu&apos;il faut pour un registre médical sérieux.
            </h2>
            <p className="text-lg text-slate-600 mt-4">
              Conçu pour la pratique clinique : saisie rapide, suivi rigoureux, export fiable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <FileText className="w-6 h-6" />,
                tone: 'bg-blue-50 text-blue-600',
                title: 'Fiche Guide CDT intégrée',
                body:
                  'Les 38 champs de la fiche officielle, choix prédéfinis (CPT/CVT/COT, T1-T4, R0/R1/R2, RC/Récidive…). Plus de saisies libres incohérentes.',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                tone: 'bg-emerald-50 text-emerald-600',
                title: '100 % local, 100 % privé',
                body:
                  "Aucune donnée ne quitte votre machine. Pas de cloud, pas de compte, pas d'inscription. Conforme aux exigences de confidentialité médicale.",
              },
              {
                icon: <FileSpreadsheet className="w-6 h-6" />,
                tone: 'bg-amber-50 text-amber-600',
                title: 'Exports Excel & PDF',
                body:
                  "Liste complète au format .xlsx pour l'analyse, fiche patient individuelle au format PDF prête à imprimer ou archiver.",
              },
              {
                icon: <Smartphone className="w-6 h-6" />,
                tone: 'bg-purple-50 text-purple-600',
                title: 'Multi-plateforme',
                body:
                  "Windows en .exe portable, Android en APK, iOS via Xcode. Une seule base de code, une expérience unifiée.",
              },
              {
                icon: <Clock className="w-6 h-6" />,
                tone: 'bg-rose-50 text-rose-600',
                title: 'Audit-trail automatique',
                body:
                  "Chaque modification crée un instantané daté de l'état précédent. Traçabilité régulatoire pour un registre médical sérieux.",
              },
              {
                icon: <Save className="w-6 h-6" />,
                tone: 'bg-cyan-50 text-cyan-600',
                title: 'Sauvegarde JSON',
                body:
                  "Export et import de l'intégralité du registre en un clic. Migration entre postes triviale, archivage simple, lisible par n'importe quel outil.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl bg-white border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition"
              >
                <div className={`w-12 h-12 rounded-xl ${f.tone} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOADS */}
      <section id="downloads" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold tracking-wide uppercase">
              Téléchargement
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-4 tracking-tight">
              Choisissez votre plateforme.
            </h2>
            <p className="text-lg text-slate-600 mt-4">
              Tous les binaires sont gratuits, hors-ligne et open source.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Windows */}
            <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-px shadow-xl shadow-blue-500/20">
              <div className="rounded-2xl bg-white p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <WindowsIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Windows</div>
                      <div className="text-xs text-slate-500">10 / 11 · 64-bit</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold">
                    Disponible
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
                  Fichier .exe portable. Aucune installation, aucun privilège admin. La base de données vit à
                  côté du fichier.
                </p>
                <a
                  href={WIN_URL}
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition"
                >
                  <Download className="w-5 h-5" />
                  Télécharger (132 MB)
                </a>
                <div className="text-[11px] text-slate-400 text-center mt-3">{RELEASE_TAG}</div>
              </div>
            </div>

            {/* Android */}
            <div className="relative rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-px shadow-xl shadow-emerald-500/20">
              <div className="rounded-2xl bg-white p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <AndroidIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Android</div>
                      <div className="text-xs text-slate-500">7.0+ · APK</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold">
                    Disponible
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
                  APK pour installation directe. SQLite natif, base dans le sandbox de l&apos;application.
                  Compatible tablette et smartphone.
                </p>
                <a
                  href={ANDROID_URL}
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition"
                >
                  <Download className="w-5 h-5" />
                  Télécharger l&apos;APK (~8 MB)
                </a>
                <div className="text-[11px] text-slate-400 text-center mt-3">{RELEASE_TAG}</div>
              </div>
            </div>

            {/* iOS */}
            <div className="rounded-2xl bg-white border border-slate-200 p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">iOS</div>
                    <div className="text-xs text-slate-500">15+ · iPhone / iPad</div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                  Sur demande
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
                Build iOS via le code source. Nécessite Xcode et un compte Apple Developer pour signer
                l&apos;application.
              </p>
              <a
                href={`${REPO_URL}#-ios`}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 transition"
              >
                Instructions de build
              </a>
              <div className="text-[11px] text-slate-400 text-center mt-3">macOS requis</div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-10">
            Code source complet sur{' '}
            <a href={REPO_URL} className="font-semibold text-slate-900 hover:underline">
              GitHub
            </a>
            {' · '}
            <a href={`${REPO_URL}/releases`} className="font-semibold text-slate-900 hover:underline">
              historique des versions
            </a>
            {' · '}
            <Link href="/app/" className="font-semibold text-slate-900 hover:underline">
              démo en ligne
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold tracking-wide uppercase">
              FAQ
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-4 tracking-tight">Questions fréquentes</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Mes données sont-elles vraiment sécurisées ?',
                a:
                  "Oui. L'application ne fait aucune requête réseau. Les données vivent dans un fichier registre.json à côté de l'.exe (Windows) ou dans le sandbox sécurisé de l'app (Android/iOS).",
              },
              {
                q: 'Comment partager les données entre plusieurs postes ?',
                a:
                  "Utilisez l'export / import JSON depuis le panneau Administration. Vous pouvez aussi placer le fichier sur un dossier réseau (pas d'écriture concurrente : un seul utilisateur à la fois).",
              },
              {
                q: 'Pourquoi pas de cloud ou de compte ?',
                a:
                  'Choix délibéré. Les données médicales sont sensibles ; les héberger dans le cloud ajoute des contraintes réglementaires sans valeur ajoutée pour un registre individuel.',
              },
              {
                q: 'Puis-je modifier les champs ou les choix prédéfinis ?',
                a:
                  "Le code est open source. Toutes les listes sont centralisées dans lib/options.ts et le schéma dans lib/schemas.ts. Modifier, recompiler, redistribuer.",
              },
              {
                q: 'Y a-t-il un audit-trail ?',
                a:
                  "Oui. Chaque modification d'un dossier crée un instantané daté. Les exports / imports / créations / suppressions sont aussi journalisés (visible dans Administration).",
              },
            ].map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-slate-200 bg-white p-5 open:shadow-md transition"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
                  {f.q}
                  <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180 text-slate-400" />
                </summary>
                <p className="text-slate-600 mt-3 text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 sm:p-16 overflow-hidden text-center">
            <h2 className="relative text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Commencez à suivre vos patients dès maintenant.
            </h2>
            <p className="relative text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Téléchargez l&apos;application en un clic. Aucun compte requis, vos données restent chez vous.
            </p>
            <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={WIN_URL}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-700 font-bold shadow-2xl hover:scale-105 transition"
              >
                <WindowsIcon className="w-5 h-5" />
                Télécharger pour Windows
              </a>
              <a
                href={ANDROID_URL}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 text-white font-bold shadow-2xl hover:scale-105 transition"
              >
                <AndroidIcon className="w-5 h-5" />
                Télécharger pour Android
              </a>
            </div>
            <Link
              href="/app/"
              className="relative inline-flex items-center gap-1 text-blue-100 hover:text-white text-sm mt-6 transition"
            >
              Ou lancez la démo dans le navigateur <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <div className="font-bold text-slate-900">Registre CDT</div>
              <div className="text-xs text-slate-500">© 2026 — Open source</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <a href={REPO_URL} className="hover:text-slate-900 transition flex items-center gap-1.5">
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a href={`${REPO_URL}/releases`} className="hover:text-slate-900 transition">
              Versions
            </a>
            <a href={`${REPO_URL}/issues`} className="hover:text-slate-900 transition">
              Signaler un bug
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
