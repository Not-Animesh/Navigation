"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Settings,
  User,
  Palette,
  Map,
  Navigation,
  Bell,
  Shield,
  Accessibility,
  Database,
  Download,
  Upload,
  RotateCcw,
  Check,
  ChevronRight,
  Monitor,
  Moon,
  Sun,
  MapPin,
  Compass,
  Route,
  Footprints,
  Ruler,
  Volume2,
  Vibrate,
  Languages,
  Clock,
  Eye,
  EyeOff,
  Type,
  Zap,
  Info,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  Smartphone,
  GraduationCap,
  Building2,
  Layers3,
  Laptop,
  Save,
  Menu,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ThemeMode = "light" | "dark" | "system";
type Density = "comfortable" | "compact";
type MapType = "roadmap" | "satellite" | "hybrid";
type DistanceUnit = "meters" | "kilometers";
type TravelMode = "walking" | "driving";
type Language = "en" | "hi";
type StartingPoint = "gps" | "campus-center" | "manual";

type CampusSettings = {
  profile: {
    fullName: string;
    email: string;
    role: string;
    studentId: string;
  };

  general: {
    language: Language;
    theme: ThemeMode;
    density: Density;
    startPage: string;
    rememberLastPage: boolean;
  };

  map: {
    defaultMapType: MapType;
    defaultBlock: string;
    defaultFloor: string;
    showBuildingLabels: boolean;
    showFacilityMarkers: boolean;
    showUserLocation: boolean;
    autoCenterLocation: boolean;
    rememberMapPosition: boolean;
  };

  navigation: {
    travelMode: TravelMode;
    distanceUnit: DistanceUnit;
    useGpsByDefault: boolean;
    voiceInstructions: boolean;
    showStepByStep: boolean;
    avoidStairs: boolean;
    preferElevators: boolean;
    confirmBeforeStarting: boolean;
  };

  notifications: {
    routeUpdates: boolean;
    campusAnnouncements: boolean;
    navigationAlerts: boolean;
    serviceUpdates: boolean;
    sound: boolean;
    vibration: boolean;
  };

  accessibility: {
    largerText: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    showIconLabels: boolean;
    keyboardNavigation: boolean;
  };

  privacy: {
    saveRecentSearches: boolean;
    saveRecentDestinations: boolean;
    shareLocationOnlyDuringNavigation: boolean;
  };
};

type SettingsSection =
  | "general"
  | "appearance"
  | "map"
  | "navigation"
  | "notifications"
  | "accessibility"
  | "privacy"
  | "data";

type SectionDefinition = {
  id: SettingsSection;
  label: string;
  description: string;
  icon: typeof Settings;
};

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
};

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

type SettingRowProps = {
  icon?: typeof Settings;
  title: string;
  description?: string;
  children?: ReactNode;
};

/* -------------------------------------------------------------------------- */
/* Defaults                                                                   */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "gu-indoor-navigator-settings";
const SETTINGS_VERSION = 1;

const defaultSettings: CampusSettings = {
  profile: {
    fullName: "Campus User",
    email: "",
    role: "Student",
    studentId: "",
  },

  general: {
    language: "en",
    theme: "dark",
    density: "comfortable",
    startPage: "/dashboard",
    rememberLastPage: true,
  },

  map: {
    defaultMapType: "hybrid",
    defaultBlock: "c-block",
    defaultFloor: "Ground Floor",
    showBuildingLabels: true,
    showFacilityMarkers: true,
    showUserLocation: true,
    autoCenterLocation: false,
    rememberMapPosition: true,
  },

  navigation: {
    travelMode: "walking",
    distanceUnit: "meters",
    useGpsByDefault: true,
    voiceInstructions: false,
    showStepByStep: true,
    avoidStairs: false,
    preferElevators: false,
    confirmBeforeStarting: false,
  },

  notifications: {
    routeUpdates: true,
    campusAnnouncements: true,
    navigationAlerts: true,
    serviceUpdates: true,
    sound: false,
    vibration: false,
  },

  accessibility: {
    largerText: false,
    highContrast: false,
    reducedMotion: false,
    showIconLabels: true,
    keyboardNavigation: true,
  },

  privacy: {
    saveRecentSearches: true,
    saveRecentDestinations: true,
    shareLocationOnlyDuringNavigation: true,
  },
};

const sections: SectionDefinition[] = [
  {
    id: "general",
    label: "General",
    description: "Profile and basic preferences",
    icon: User,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Theme and interface settings",
    icon: Palette,
  },
  {
    id: "map",
    label: "Campus Map",
    description: "Map display and default location",
    icon: Map,
  },
  {
    id: "navigation",
    label: "Navigation",
    description: "Route and direction preferences",
    icon: Navigation,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alerts and campus updates",
    icon: Bell,
  },
  {
    id: "accessibility",
    label: "Accessibility",
    description: "Make navigation easier to use",
    icon: Accessibility,
  },
  {
    id: "privacy",
    label: "Privacy",
    description: "Location and browsing preferences",
    icon: Shield,
  },
  {
    id: "data",
    label: "Data & Storage",
    description: "Export and manage local settings",
    icon: Database,
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeSettings(saved: unknown): CampusSettings {
  if (!isObject(saved)) {
    return defaultSettings;
  }

  const result = structuredClone(defaultSettings);

  const groups: (keyof CampusSettings)[] = [
    "profile",
    "general",
    "map",
    "navigation",
    "notifications",
    "accessibility",
    "privacy",
  ];

  for (const group of groups) {
    const savedGroup = saved[group];

    if (isObject(savedGroup)) {
      Object.assign(result[group], savedGroup);
    }
  }

  return result;
}

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

function getThemeValue(theme: ThemeMode): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return theme;
}

/* -------------------------------------------------------------------------- */
/* Reusable UI components                                                     */
/* -------------------------------------------------------------------------- */

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold">{title}</h2>

        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: SettingRowProps) {
  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}

        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>

          {description && (
            <p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      {children && <div className="shrink-0 sm:pl-4">{children}</div>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <span className="sr-only">{label}</span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          checked ? "border-foreground bg-foreground" : "border-border bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4.5 rounded-full transition-all ${
            checked
              ? "left-[21px] bg-background"
              : "left-0.5 bg-muted-foreground"
          }`}
        />
      </button>

      {description && <span className="sr-only">{description}</span>}
    </label>
  );
}

function SelectField({
  label,
  description,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <div className="min-w-[170px] space-y-1.5">
      <label className="sr-only">{label}</label>

      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {description && (
        <p className="text-[10px] text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      aria-label={label}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full min-w-[180px] rounded-lg border border-border bg-background px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 sm:max-w-xs"
    />
  );
}

function ThemeOption({
  value,
  selected,
  icon: Icon,
  label,
  onClick,
}: {
  value: ThemeMode;
  selected: boolean;
  icon: typeof Sun;
  label: string;
  onClick: (value: ThemeMode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      aria-pressed={selected}
      className={`flex flex-1 flex-col items-center gap-3 rounded-xl border p-4 transition-colors ${
        selected
          ? "border-foreground bg-muted/60"
          : "border-border bg-background hover:bg-accent"
      }`}
    >
      <Icon className="size-5" />

      <span className="text-xs font-medium">{label}</span>

      {selected && (
        <span className="flex size-4 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="size-3" />
        </span>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function SettingsPage() {
  const [settings, setSettings] = useState<CampusSettings>(defaultSettings);

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("general");

  const [isLoaded, setIsLoaded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importError, setImportError] = useState("");
  const [toast, setToast] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ------------------------------------------------------------------------ */
  /* Load settings                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as {
          version?: number;
          settings?: unknown;
        };

        const storedSettings =
          isObject(parsed) && "settings" in parsed ? parsed.settings : parsed;

        setSettings(mergeSettings(storedSettings));
      }
    } catch (error) {
      console.error("Unable to load settings:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Apply theme                                                               */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!isLoaded) return;

    const applyTheme = () => {
      const theme = getThemeValue(settings.general.theme);

      document.documentElement.classList.toggle("dark", theme === "dark");
    };

    applyTheme();

    if (settings.general.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      mediaQuery.addEventListener("change", applyTheme);

      return () => {
        mediaQuery.removeEventListener("change", applyTheme);
      };
    }
  }, [settings.general.theme, isLoaded]);

  /* ------------------------------------------------------------------------ */
  /* Apply accessibility preferences                                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;

    root.classList.toggle("large-text", settings.accessibility.largerText);

    root.classList.toggle("high-contrast", settings.accessibility.highContrast);

    root.classList.toggle(
      "reduce-motion",
      settings.accessibility.reducedMotion,
    );

    return () => {
      root.classList.remove("large-text", "high-contrast", "reduce-motion");
    };
  }, [settings.accessibility, isLoaded]);

  /* ------------------------------------------------------------------------ */
  /* Update helpers                                                            */
  /* ------------------------------------------------------------------------ */

  const updateGroup = useCallback(
    <K extends keyof CampusSettings>(
      group: K,
      key: keyof CampusSettings[K],
      value: CampusSettings[K][keyof CampusSettings[K]],
    ) => {
      setSettings((previous) => ({
        ...previous,
        [group]: {
          ...previous[group],
          [key]: value,
        },
      }));

      setIsDirty(true);
    },
    [],
  );

  const updateProfile = useCallback(
    (key: keyof CampusSettings["profile"], value: string) => {
      setSettings((previous) => ({
        ...previous,
        profile: {
          ...previous.profile,
          [key]: value,
        },
      }));

      setIsDirty(true);
    },
    [],
  );

  /* ------------------------------------------------------------------------ */
  /* Save settings                                                             */
  /* ------------------------------------------------------------------------ */

  const saveSettings = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: SETTINGS_VERSION,
          updatedAt: new Date().toISOString(),
          settings,
        }),
      );

      setIsDirty(false);
      setToast("Settings saved successfully.");

      window.setTimeout(() => setToast(""), 3000);
    } catch (error) {
      console.error("Unable to save settings:", error);
      setToast("Unable to save settings. Check browser storage.");
    }
  }, [settings]);

  /* ------------------------------------------------------------------------ */
  /* Reset settings                                                            */
  /* ------------------------------------------------------------------------ */

  const resetSettings = () => {
    setSettings(defaultSettings);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Unable to clear settings:", error);
    }

    setIsDirty(false);
    setShowResetDialog(false);
    setToast("Settings have been restored to defaults.");

    window.setTimeout(() => setToast(""), 3000);
  };

  /* ------------------------------------------------------------------------ */
  /* Export settings                                                           */
  /* ------------------------------------------------------------------------ */

  const exportSettings = () => {
    const exportData = {
      application: "Galgotias Indoor Navigator",
      version: SETTINGS_VERSION,
      exportedAt: new Date().toISOString(),
      settings,
    };

    downloadJson(
      "galgotias-navigator-settings.json",
      JSON.stringify(exportData, null, 2),
    );

    setToast("Settings export downloaded.");
    window.setTimeout(() => setToast(""), 3000);
  };

  /* ------------------------------------------------------------------------ */
  /* Import settings                                                           */
  /* ------------------------------------------------------------------------ */

  const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImportError("");

    try {
      const content = await file.text();
      const parsed: unknown = JSON.parse(content);

      if (!isObject(parsed)) {
        throw new Error("Invalid settings file.");
      }

      const imported = "settings" in parsed ? parsed.settings : parsed;

      if (!isObject(imported)) {
        throw new Error("Settings data was not found in this file.");
      }

      setSettings(mergeSettings(imported));
      setIsDirty(true);
      setShowImportDialog(false);
      setToast("Settings imported. Save to apply them permanently.");

      window.setTimeout(() => setToast(""), 4000);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Unable to import this file.",
      );
      setShowImportDialog(true);
    } finally {
      event.target.value = "";
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Active section                                                            */
  /* ------------------------------------------------------------------------ */

  const activeSectionData = sections.find(
    (section) => section.id === activeSection,
  );

  const navigateToSection = (section: SettingsSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          Loading settings...
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>Campus</span>
              <span>/</span>
              <span className="text-foreground">Settings</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Settings
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Manage your account, campus map, navigation and application
              preferences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowResetDialog(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>

            <button
              type="button"
              onClick={saveSettings}
              disabled={!isDirty}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="size-3.5" />
              Save changes
            </button>
          </div>
        </header>

        {/* Save status */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            {isDirty ? (
              <>
                <AlertCircle className="size-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  You have unsaved changes.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  All settings are saved.
                </p>
              </>
            )}
          </div>

          <span className="text-[10px] text-muted-foreground">
            Stored locally on this device
          </span>
        </div>

        {/* Mobile section selector */}
        <div className="mb-5 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-11 w-full items-center justify-between rounded-lg border border-border bg-card px-4 text-sm"
          >
            <span className="flex items-center gap-2">
              {activeSectionData && (
                <activeSectionData.icon className="size-4" />
              )}
              {activeSectionData?.label}
            </span>

            <Menu className="size-4" />
          </button>

          {mobileMenuOpen && (
            <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
              {sections.map((section) => {
                const Icon = section.icon;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => navigateToSection(section.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-xs transition-colors hover:bg-accent ${
                      activeSection === section.id
                        ? "bg-muted font-semibold"
                        : ""
                    }`}
                  >
                    <Icon className="size-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-1">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preferences
              </p>

              {sections.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => navigateToSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />

                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium">
                        {section.label}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        {section.description}
                      </span>
                    </span>

                    {active && <ChevronRight className="size-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0 space-y-5">
            {/* ------------------------------------------------------------ */}
            {/* GENERAL                                                       */}
            {/* ------------------------------------------------------------ */}

            {activeSection === "general" && (
              <>
                <SectionCard
                  title="Profile information"
                  description="Manage the personal information displayed in your application."
                >
                  <SettingRow
                    icon={User}
                    title="Full name"
                    description="The name displayed in your campus profile."
                  >
                    <TextField
                      label="Full name"
                      value={settings.profile.fullName}
                      onChange={(value) => updateProfile("fullName", value)}
                      placeholder="Enter your name"
                    />
                  </SettingRow>

                  <SettingRow
                    icon={User}
                    title="Email address"
                    description="Your contact email address."
                  >
                    <TextField
                      label="Email address"
                      value={settings.profile.email}
                      onChange={(value) => updateProfile("email", value)}
                      placeholder="name@example.com"
                      type="email"
                    />
                  </SettingRow>

                  <SettingRow
                    icon={GraduationCap}
                    title="User role"
                    description="Your role within the university."
                  >
                    <SelectField
                      label="User role"
                      value={settings.profile.role}
                      onChange={(value) => updateProfile("role", value)}
                      options={[
                        { label: "Student", value: "Student" },
                        { label: "Faculty", value: "Faculty" },
                        { label: "Staff", value: "Staff" },
                        { label: "Visitor", value: "Visitor" },
                      ]}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={User}
                    title="Student / employee ID"
                    description="Optional identification number. Stored only in this browser."
                  >
                    <TextField
                      label="Student or employee ID"
                      value={settings.profile.studentId}
                      onChange={(value) => updateProfile("studentId", value)}
                      placeholder="Enter ID"
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard
                  title="Regional preferences"
                  description="Choose your preferred language and application defaults."
                >
                  <SettingRow
                    icon={Languages}
                    title="Language"
                    description="Choose the preferred application language."
                  >
                    <SelectField
                      label="Language"
                      value={settings.general.language}
                      onChange={(value) =>
                        updateGroup("general", "language", value)
                      }
                      options={[
                        { label: "English", value: "en" },
                        { label: "Hindi", value: "hi" },
                      ]}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={MapPin}
                    title="Default landing page"
                    description="Choose the page opened when you enter the application."
                  >
                    <SelectField
                      label="Default landing page"
                      value={settings.general.startPage}
                      onChange={(value) =>
                        updateGroup("general", "startPage", value)
                      }
                      options={[
                        { label: "Dashboard", value: "/dashboard" },
                        { label: "Campus Map", value: "/campus-map" },
                        { label: "Navigation", value: "/navigation" },
                        { label: "Directory", value: "/directory" },
                      ]}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Clock}
                    title="Remember last visited page"
                    description="Keep your preferred starting page for future visits."
                  >
                    <Toggle
                      label="Remember last visited page"
                      checked={settings.general.rememberLastPage}
                      onChange={(value) =>
                        updateGroup("general", "rememberLastPage", value)
                      }
                    />
                  </SettingRow>
                </SectionCard>
              </>
            )}

            {/* ------------------------------------------------------------ */}
            {/* APPEARANCE                                                    */}
            {/* ------------------------------------------------------------ */}

            {activeSection === "appearance" && (
              <>
                <SectionCard
                  title="Appearance"
                  description="Personalise the visual appearance of the navigator."
                >
                  <div className="px-5 py-5 sm:px-6">
                    <div className="mb-4">
                      <p className="text-sm font-medium">Theme</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Select a theme for the application.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <ThemeOption
                        value="light"
                        label="Light"
                        icon={Sun}
                        selected={settings.general.theme === "light"}
                        onClick={(value) =>
                          updateGroup("general", "theme", value)
                        }
                      />

                      <ThemeOption
                        value="dark"
                        label="Dark"
                        icon={Moon}
                        selected={settings.general.theme === "dark"}
                        onClick={(value) =>
                          updateGroup("general", "theme", value)
                        }
                      />

                      <ThemeOption
                        value="system"
                        label="System"
                        icon={Monitor}
                        selected={settings.general.theme === "system"}
                        onClick={(value) =>
                          updateGroup("general", "theme", value)
                        }
                      />
                    </div>
                  </div>

                  <SettingRow
                    icon={Laptop}
                    title="Interface density"
                    description="Choose how much spacing is used between interface elements."
                  >
                    <SelectField
                      label="Interface density"
                      value={settings.general.density}
                      onChange={(value) =>
                        updateGroup("general", "density", value)
                      }
                      options={[
                        {
                          label: "Comfortable",
                          value: "comfortable",
                        },
                        { label: "Compact", value: "compact" },
                      ]}
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard
                  title="Display preferences"
                  description="Control how information is presented."
                >
                  <SettingRow
                    icon={Eye}
                    title="Building and location labels"
                    description="Display labels for campus locations wherever supported."
                  >
                    <Toggle
                      label="Building labels"
                      checked={settings.map.showBuildingLabels}
                      onChange={(value) =>
                        updateGroup("map", "showBuildingLabels", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={MapPin}
                    title="Facility markers"
                    description="Show available facility markers on the campus map."
                  >
                    <Toggle
                      label="Facility markers"
                      checked={settings.map.showFacilityMarkers}
                      onChange={(value) =>
                        updateGroup("map", "showFacilityMarkers", value)
                      }
                    />
                  </SettingRow>
                </SectionCard>
              </>
            )}

            {/* ------------------------------------------------------------ */}
            {/* CAMPUS MAP                                                    */}
            {/* ------------------------------------------------------------ */}

            {activeSection === "map" && (
              <>
                <SectionCard
                  title="Default map preferences"
                  description="Choose how the campus map should appear when opened."
                >
                  <SettingRow
                    icon={Map}
                    title="Default map type"
                    description="Choose the default Google Maps layer."
                  >
                    <SelectField
                      label="Default map type"
                      value={settings.map.defaultMapType}
                      onChange={(value) =>
                        updateGroup("map", "defaultMapType", value)
                      }
                      options={[
                        { label: "Roadmap", value: "roadmap" },
                        { label: "Satellite", value: "satellite" },
                        { label: "Hybrid", value: "hybrid" },
                      ]}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Building2}
                    title="Default campus block"
                    description="Select the block preselected when opening the campus map."
                  >
                    <SelectField
                      label="Default campus block"
                      value={settings.map.defaultBlock}
                      onChange={(value) =>
                        updateGroup("map", "defaultBlock", value)
                      }
                      options={[
                        { label: "A-Block", value: "a-block" },
                        { label: "B-Block", value: "b-block" },
                        { label: "C-Block", value: "c-block" },
                        {
                          label: "AI-ML Block",
                          value: "ai-ml-block",
                        },
                      ]}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Layers3}
                    title="Default floor"
                    description="Preferred floor selection when viewing a block."
                  >
                    <SelectField
                      label="Default floor"
                      value={settings.map.defaultFloor}
                      onChange={(value) =>
                        updateGroup("map", "defaultFloor", value)
                      }
                      options={[
                        {
                          label: "Ground Floor",
                          value: "Ground Floor",
                        },
                        {
                          label: "First Floor",
                          value: "First Floor",
                        },
                        {
                          label: "Second Floor",
                          value: "Second Floor",
                        },
                        {
                          label: "Third Floor",
                          value: "Third Floor",
                        },
                        {
                          label: "Fourth Floor",
                          value: "Fourth Floor",
                        },
                        {
                          label: "Fifth Floor",
                          value: "Fifth Floor",
                        },
                      ]}
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard
                  title="Map behaviour"
                  description="Configure location and map display preferences."
                >
                  <SettingRow
                    icon={MapPin}
                    title="Show my location"
                    description="Display your current position on the campus map when available."
                  >
                    <Toggle
                      label="Show my location"
                      checked={settings.map.showUserLocation}
                      onChange={(value) =>
                        updateGroup("map", "showUserLocation", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Compass}
                    title="Automatically centre location"
                    description="Centre the map around your location when location access is available."
                  >
                    <Toggle
                      label="Automatically centre location"
                      checked={settings.map.autoCenterLocation}
                      onChange={(value) =>
                        updateGroup("map", "autoCenterLocation", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Map}
                    title="Remember map position"
                    description="Keep the last selected map position and zoom level."
                  >
                    <Toggle
                      label="Remember map position"
                      checked={settings.map.rememberMapPosition}
                      onChange={(value) =>
                        updateGroup("map", "rememberMapPosition", value)
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                  <p className="text-xs leading-5 text-muted-foreground">
                    These are saved map preferences. The Campus Map page must
                    read these settings to apply them to the actual Google Map
                    instance.
                  </p>
                </div>
              </>
            )}

            {/* ------------------------------------------------------------ */}
            {/* NAVIGATION                                                    */}
            {/* ------------------------------------------------------------ */}

            {activeSection === "navigation" && (
              <>
                <SectionCard
                  title="Route preferences"
                  description="Choose how routes and directions should be presented."
                >
                  <SettingRow
                    icon={Footprints}
                    title="Preferred travel mode"
                    description="Choose your preferred way to move around campus."
                  >
                    <SelectField
                      label="Preferred travel mode"
                      value={settings.navigation.travelMode}
                      onChange={(value) =>
                        updateGroup(
                          "navigation",
                          "travelMode",
                          value as CampusSettings["navigation"]["travelMode"],
                        )
                      }
                      options={[
                        { label: "Walking", value: "walking" },
                        { label: "Driving", value: "driving" },
                      ]}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Ruler}
                    title="Distance units"
                    description="Select the unit used to display route distances."
                  >
                    <SelectField
                      label="Distance units"
                      value={settings.navigation.distanceUnit}
                      onChange={(value) =>
                        updateGroup(
                          "navigation",
                          "distanceUnit",
                          value as CampusSettings["navigation"]["distanceUnit"],
                        )
                      }
                      options={[
                        { label: "Meters", value: "meters" },
                        { label: "Kilometers", value: "kilometers" },
                      ]}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={MapPin}
                    title="Use GPS as starting point"
                    description="Prefer your current location when creating a route."
                  >
                    <Toggle
                      label="Use GPS as starting point"
                      checked={settings.navigation.useGpsByDefault}
                      onChange={(value) =>
                        updateGroup("navigation", "useGpsByDefault", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Route}
                    title="Step-by-step directions"
                    description="Show individual route instructions instead of only the destination."
                  >
                    <Toggle
                      label="Step-by-step directions"
                      checked={settings.navigation.showStepByStep}
                      onChange={(value) =>
                        updateGroup("navigation", "showStepByStep", value)
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard
                  title="Route accessibility"
                  description="Set preferences that can influence route selection."
                >
                  <SettingRow
                    icon={Footprints}
                    title="Avoid stairs"
                    description="Prefer routes that do not use stairs, where accessible route data exists."
                  >
                    <Toggle
                      label="Avoid stairs"
                      checked={settings.navigation.avoidStairs}
                      onChange={(value) =>
                        updateGroup("navigation", "avoidStairs", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Building2}
                    title="Prefer elevators"
                    description="Prefer elevator access where floor and elevator data is available."
                  >
                    <Toggle
                      label="Prefer elevators"
                      checked={settings.navigation.preferElevators}
                      onChange={(value) =>
                        updateGroup("navigation", "preferElevators", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Volume2}
                    title="Voice instructions"
                    description="Enable spoken directions when supported by the navigation interface."
                  >
                    <Toggle
                      label="Voice instructions"
                      checked={settings.navigation.voiceInstructions}
                      onChange={(value) =>
                        updateGroup("navigation", "voiceInstructions", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Info}
                    title="Confirm before starting"
                    description="Ask for confirmation before beginning a route."
                  >
                    <Toggle
                      label="Confirm before starting"
                      checked={settings.navigation.confirmBeforeStarting}
                      onChange={(value) =>
                        updateGroup(
                          "navigation",
                          "confirmBeforeStarting",
                          value,
                        )
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                  <p className="text-xs leading-5 text-muted-foreground">
                    Stair avoidance and elevator preferences require verified
                    indoor route connections. They will only work once the
                    indoor navigation graph contains accessible route
                    information.
                  </p>
                </div>
              </>
            )}

            {/* ------------------------------------------------------------ */}
            {/* NOTIFICATIONS                                                 */}
            {/* ------------------------------------------------------------ */}

            {activeSection === "notifications" && (
              <>
                <SectionCard
                  title="Campus notifications"
                  description="Choose which types of campus updates you want to receive."
                >
                  <SettingRow
                    icon={Route}
                    title="Route updates"
                    description="Receive updates when your active route changes."
                  >
                    <Toggle
                      label="Route updates"
                      checked={settings.notifications.routeUpdates}
                      onChange={(value) =>
                        updateGroup("notifications", "routeUpdates", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Bell}
                    title="Campus announcements"
                    description="Receive university announcements when an announcement service is connected."
                  >
                    <Toggle
                      label="Campus announcements"
                      checked={settings.notifications.campusAnnouncements}
                      onChange={(value) =>
                        updateGroup(
                          "notifications",
                          "campusAnnouncements",
                          value,
                        )
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={MapPin}
                    title="Navigation alerts"
                    description="Enable alerts related to active navigation."
                  >
                    <Toggle
                      label="Navigation alerts"
                      checked={settings.notifications.navigationAlerts}
                      onChange={(value) =>
                        updateGroup("notifications", "navigationAlerts", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Building2}
                    title="Facility updates"
                    description="Receive updates about campus facilities and services."
                  >
                    <Toggle
                      label="Facility updates"
                      checked={settings.notifications.serviceUpdates}
                      onChange={(value) =>
                        updateGroup("notifications", "serviceUpdates", value)
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard
                  title="Notification behaviour"
                  description="Control how supported notifications are presented."
                >
                  <SettingRow
                    icon={Volume2}
                    title="Notification sound"
                    description="Allow a sound when supported alerts are displayed."
                  >
                    <Toggle
                      label="Notification sound"
                      checked={settings.notifications.sound}
                      onChange={(value) =>
                        updateGroup("notifications", "sound", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Vibrate}
                    title="Vibration"
                    description="Enable vibration where the device and browser support it."
                  >
                    <Toggle
                      label="Vibration"
                      checked={settings.notifications.vibration}
                      onChange={(value) =>
                        updateGroup("notifications", "vibration", value)
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                  <p className="text-xs leading-5 text-muted-foreground">
                    These options store your notification preferences. Actual
                    push notifications and university announcements require a
                    notification service and backend integration.
                  </p>
                </div>
              </>
            )}

            {/* ------------------------------------------------------------ */}
            {/* ACCESSIBILITY                                                 */}
            {/* ------------------------------------------------------------ */}

            {activeSection === "accessibility" && (
              <>
                <SectionCard
                  title="Visual accessibility"
                  description="Adjust the interface to improve readability."
                >
                  <SettingRow
                    icon={Type}
                    title="Larger text"
                    description="Increase the root font size for improved readability."
                  >
                    <Toggle
                      label="Larger text"
                      checked={settings.accessibility.largerText}
                      onChange={(value) =>
                        updateGroup("accessibility", "largerText", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Eye}
                    title="High contrast"
                    description="Enable a stronger contrast mode for interface elements."
                  >
                    <Toggle
                      label="High contrast"
                      checked={settings.accessibility.highContrast}
                      onChange={(value) =>
                        updateGroup("accessibility", "highContrast", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Zap}
                    title="Reduced motion"
                    description="Reduce animations and transitions where supported."
                  >
                    <Toggle
                      label="Reduced motion"
                      checked={settings.accessibility.reducedMotion}
                      onChange={(value) =>
                        updateGroup("accessibility", "reducedMotion", value)
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard
                  title="Navigation accessibility"
                  description="Make important controls easier to identify and use."
                >
                  <SettingRow
                    icon={Eye}
                    title="Show icon labels"
                    description="Prefer text labels alongside icons in supported navigation controls."
                  >
                    <Toggle
                      label="Show icon labels"
                      checked={settings.accessibility.showIconLabels}
                      onChange={(value) =>
                        updateGroup("accessibility", "showIconLabels", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Laptop}
                    title="Keyboard navigation"
                    description="Keep keyboard navigation and visible focus indicators enabled."
                  >
                    <Toggle
                      label="Keyboard navigation"
                      checked={settings.accessibility.keyboardNavigation}
                      onChange={(value) =>
                        updateGroup(
                          "accessibility",
                          "keyboardNavigation",
                          value,
                        )
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                  <p className="text-xs leading-5 text-muted-foreground">
                    Accessibility options are applied to the document where
                    supported. Individual pages and map controls may need
                    additional styling to fully support them.
                  </p>
                </div>
              </>
            )}

            {/* ------------------------------------------------------------ */}
            {/* PRIVACY                                                       */}
            {/* ------------------------------------------------------------ */}

            {activeSection === "privacy" && (
              <>
                <SectionCard
                  title="Location privacy"
                  description="Control how location information is used by the application."
                >
                  <SettingRow
                    icon={MapPin}
                    title="Show location only during navigation"
                    description="Your preference for limiting location display to active navigation."
                  >
                    <Toggle
                      label="Show location only during navigation"
                      checked={
                        settings.privacy.shareLocationOnlyDuringNavigation
                      }
                      onChange={(value) =>
                        updateGroup(
                          "privacy",
                          "shareLocationOnlyDuringNavigation",
                          value,
                        )
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard
                  title="Browsing preferences"
                  description="Choose whether the application should remember your recent activity."
                >
                  <SettingRow
                    icon={Search}
                    title="Save recent searches"
                    description="Allow the application to retain recent directory and location searches."
                  >
                    <Toggle
                      label="Save recent searches"
                      checked={settings.privacy.saveRecentSearches}
                      onChange={(value) =>
                        updateGroup("privacy", "saveRecentSearches", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Route}
                    title="Save recent destinations"
                    description="Remember destinations you have previously selected."
                  >
                    <Toggle
                      label="Save recent destinations"
                      checked={settings.privacy.saveRecentDestinations}
                      onChange={(value) =>
                        updateGroup("privacy", "saveRecentDestinations", value)
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard
                  title="Privacy information"
                  description="How this version of the application handles your settings."
                >
                  <div className="space-y-4 px-5 py-5 sm:px-6">
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium">
                          Local settings storage
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Your settings are stored in your browser's local
                          storage. They are not automatically uploaded to a
                          university server.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium">
                          Location permission
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          GPS access is controlled by your browser. Location
                          access must be requested by a page that uses
                          geolocation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <EyeOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium">
                          No automatic account synchronisation
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          These preferences currently remain on this browser and
                          are not synced across devices.
                        </p>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </>
            )}

            {/* ------------------------------------------------------------ */}
            {/* DATA & STORAGE                                                */}
            {/* ------------------------------------------------------------ */}

            {activeSection === "data" && (
              <>
                <SectionCard
                  title="Settings backup"
                  description="Export or restore your application preferences."
                >
                  <SettingRow
                    icon={Download}
                    title="Export settings"
                    description="Download your saved preferences as a JSON file."
                  >
                    <button
                      type="button"
                      onClick={exportSettings}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-accent"
                    >
                      <Download className="size-3.5" />
                      Export JSON
                    </button>
                  </SettingRow>

                  <SettingRow
                    icon={Upload}
                    title="Import settings"
                    description="Restore preferences from a previously exported JSON file."
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setImportError("");
                        setShowImportDialog(true);
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-accent"
                    >
                      <Upload className="size-3.5" />
                      Import JSON
                    </button>
                  </SettingRow>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={importSettings}
                  />
                </SectionCard>

                <SectionCard
                  title="Storage information"
                  description="Information about where application preferences are stored."
                >
                  <div className="space-y-4 px-5 py-5 sm:px-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium">Browser storage</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Local storage
                        </p>
                      </div>

                      <span className="rounded-md border border-border bg-muted/40 px-2 py-1 text-[10px] font-medium">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium">Settings key</p>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                          {STORAGE_KEY}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium">
                          Application settings version
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Version {SETTINGS_VERSION}
                        </p>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Reset preferences"
                  description="Restore the application preferences to their original values."
                >
                  <SettingRow
                    icon={RotateCcw}
                    title="Restore default settings"
                    description="Reset your profile preferences, appearance, map, navigation and notification settings."
                  >
                    <button
                      type="button"
                      onClick={() => setShowResetDialog(true)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-accent"
                    >
                      <RotateCcw className="size-3.5" />
                      Restore defaults
                    </button>
                  </SettingRow>
                </SectionCard>

                <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                  <p className="text-xs leading-5 text-muted-foreground">
                    Resetting preferences removes this application's saved
                    settings key. It does not clear browser history, other
                    websites' storage, or unrelated application data.
                  </p>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="flex flex-col justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
              <p className="text-[10px] text-muted-foreground">
                Galgotias Indoor Navigator · Application Settings
              </p>

              <button
                type="button"
                onClick={saveSettings}
                disabled={!isDirty}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save className="size-3.5" />
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Reset confirmation dialog                                           */}
      {/* ------------------------------------------------------------------ */}

      {showResetDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowResetDialog(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <RotateCcw className="size-5 text-foreground" />
            </div>

            <h2
              id="reset-dialog-title"
              className="mt-4 text-base font-semibold"
            >
              Restore default settings?
            </h2>

            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Your saved preferences will be replaced with the application
              defaults. This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetDialog(false)}
                className="h-9 rounded-lg border border-border px-4 text-xs font-medium transition-colors hover:bg-accent"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={resetSettings}
                className="h-9 rounded-lg bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-90"
              >
                Restore defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Import feedback dialog                                               */}
      {/* ------------------------------------------------------------------ */}

      {showImportDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowImportDialog(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-dialog-title"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Upload className="size-5" />
              </div>

              <button
                type="button"
                onClick={() => setShowImportDialog(false)}
                aria-label="Close import dialog"
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <h2
              id="import-dialog-title"
              className="mt-4 text-base font-semibold"
            >
              Import settings
            </h2>

            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Select a previously exported Galgotias Navigator JSON settings
              file. Imported settings will replace your current unsaved
              preferences.
            </p>

            {importError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p className="text-xs leading-5">{importError}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportDialog(false)}
                className="h-9 rounded-lg border border-border px-4 text-xs font-medium hover:bg-accent"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-xs font-medium text-background hover:opacity-90"
              >
                <Upload className="size-3.5" />
                Choose file
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Toast                                                                */}
      {/* ------------------------------------------------------------------ */}

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[110] flex max-w-sm items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xl"
        >
          <CheckCircle2 className="size-4 shrink-0 text-foreground" />
          <p className="text-xs font-medium">{toast}</p>

          <button
            type="button"
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
            className="ml-2 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </main>
  );
}
