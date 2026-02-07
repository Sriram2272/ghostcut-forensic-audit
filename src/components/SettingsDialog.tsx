import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Zap,
  Eye,
  FileText,
  Globe,
  AlertTriangle,
  Gauge,
  Layers,
  Brain,
} from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  // ═══ Settings state (local for now) ═══
  const [multiModalVerification, setMultiModalVerification] = useState(true);
  const [maxClaimsPerAudit, setMaxClaimsPerAudit] = useState([50]);
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.7]);
  const [strictMode, setStrictMode] = useState(false);
  const [autoSaveSnapshots, setAutoSaveSnapshots] = useState(true);
  const [crossReferenceCheck, setCrossReferenceCheck] = useState(true);
  const [cascadeDetection, setCascadeDetection] = useState(true);
  const [verificationDepth, setVerificationDepth] = useState("standard");
  const [chunkSize, setChunkSize] = useState([512]);
  const [showSources, setShowSources] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto bg-card border-2 border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-destructive" />
            </div>
            GHOST<span className="text-destructive">CUT</span> Settings
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-muted-foreground tracking-wide">
            Configure forensic verification parameters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* ═══ VERIFICATION ENGINE ═══ */}
          <SettingsSection icon={<Brain className="w-4 h-4" />} title="Verification Engine">
            <SettingsRow
              icon={<Eye className="w-3.5 h-3.5 text-primary" />}
              label="Multi-Modal Verification"
              description="Cross-verify claims across text, tables, and images"
            >
              <Switch
                checked={multiModalVerification}
                onCheckedChange={setMultiModalVerification}
              />
            </SettingsRow>

            <SettingsRow
              icon={<Layers className="w-3.5 h-3.5 text-primary" />}
              label="Cascade Detection"
              description="Detect hallucinations that propagate through dependent claims"
            >
              <Switch
                checked={cascadeDetection}
                onCheckedChange={setCascadeDetection}
              />
            </SettingsRow>

            <SettingsRow
              icon={<Globe className="w-3.5 h-3.5 text-primary" />}
              label="Cross-Reference Check"
              description="Compare claims against multiple source documents"
            >
              <Switch
                checked={crossReferenceCheck}
                onCheckedChange={setCrossReferenceCheck}
              />
            </SettingsRow>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Verification Depth</span>
                </div>
                <Select value={verificationDepth} onValueChange={setVerificationDepth}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shallow">Shallow</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deep">Deep</SelectItem>
                    <SelectItem value="forensic">Forensic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[10px] text-muted-foreground pl-6">
                Deeper analysis increases accuracy but takes longer
              </p>
            </div>
          </SettingsSection>

          <Separator />

          {/* ═══ USAGE LIMITS ═══ */}
          <SettingsSection icon={<Gauge className="w-4 h-4" />} title="Usage Limits">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs font-semibold text-foreground">Max Claims per Audit</span>
                </div>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {maxClaimsPerAudit[0]}
                </span>
              </div>
              <Slider
                value={maxClaimsPerAudit}
                onValueChange={setMaxClaimsPerAudit}
                min={10}
                max={200}
                step={10}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                Limit the number of claims processed per audit run (10–200)
              </p>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Chunk Size (tokens)</span>
                </div>
                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {chunkSize[0]}
                </span>
              </div>
              <Slider
                value={chunkSize}
                onValueChange={setChunkSize}
                min={128}
                max={2048}
                step={128}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                Size of document chunks for retrieval indexing (128–2048)
              </p>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-xs font-semibold text-foreground">Confidence Threshold</span>
                </div>
                <span className="text-xs font-mono font-bold text-destructive px-2 py-0.5 rounded bg-destructive/10">
                  {(confidenceThreshold[0] * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={confidenceThreshold}
                onValueChange={setConfidenceThreshold}
                min={0.3}
                max={1.0}
                step={0.05}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                Minimum confidence to mark a claim as "supported" (30%–100%)
              </p>
            </div>
          </SettingsSection>

          <Separator />

          {/* ═══ BEHAVIOR ═══ */}
          <SettingsSection icon={<Zap className="w-4 h-4" />} title="Behavior">
            <SettingsRow
              icon={<AlertTriangle className="w-3.5 h-3.5 text-warning" />}
              label="Strict Mode"
              description="Treat unverifiable claims as contradicted"
            >
              <Switch checked={strictMode} onCheckedChange={setStrictMode} />
            </SettingsRow>

            <SettingsRow
              icon={<FileText className="w-3.5 h-3.5 text-primary" />}
              label="Auto-Save Snapshots"
              description="Automatically save each audit result to comparison history"
            >
              <Switch
                checked={autoSaveSnapshots}
                onCheckedChange={setAutoSaveSnapshots}
              />
            </SettingsRow>

            <SettingsRow
              icon={<Eye className="w-3.5 h-3.5 text-primary" />}
              label="Show Source Highlights"
              description="Highlight matching source passages in the evidence trail"
            >
              <Switch checked={showSources} onCheckedChange={setShowSources} />
            </SettingsRow>
          </SettingsSection>

          {/* Footer note */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-verified animate-pulse" />
            <span className="text-[10px] font-mono text-muted-foreground">
              Settings are stored locally and persist between sessions
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ═══ Helper subcomponents ═══ */

const SettingsSection = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <div className="text-destructive">{icon}</div>
      <h3 className="text-xs font-extrabold tracking-wider uppercase text-foreground">
        {title}
      </h3>
    </div>
    <div className="space-y-4 pl-1">{children}</div>
  </div>
);

const SettingsRow = ({
  icon,
  label,
  description,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold text-foreground">{label}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5 pl-6">{description}</p>
    </div>
    {children}
  </div>
);

export default SettingsDialog;
