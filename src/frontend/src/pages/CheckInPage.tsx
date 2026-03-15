import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  QrCode,
  RotateCcw,
  ScanFace,
  Settings,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCamera } from "../camera/useCamera";
import {
  CheckInResult,
  useCheckInByFace,
  useCheckInByQR,
  useGetAllMembers,
} from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";

interface Props {
  onNavigateAdmin: () => void;
}

type CheckInState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; memberName: string; method: string; time: string }
  | { kind: "error"; message: string };

function getErrorMessage(result: CheckInResult): string {
  switch (result) {
    case CheckInResult.notFound:
      return "Member not found. Please check your credentials.";
    case CheckInResult.duplicate:
      return "Already checked in today! See you tomorrow. 💪";
    case CheckInResult.invalidMethod:
      return "Invalid check-in method. Please try again.";
    default:
      return "Check-in failed. Please try again.";
  }
}

function QRTab({
  onResult,
}: {
  onResult: (result: CheckInState) => void;
}) {
  const checkIn = useCheckInByQR();
  const { data: members } = useGetAllMembers();
  const processedRef = useRef<string | null>(null);

  const {
    isScanning,
    isActive,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    qrResults,
    clearResults,
    videoRef,
    canvasRef,
    isSupported,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 150,
    maxResults: 3,
  });

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const membersRef = useRef(members);
  membersRef.current = members;
  const checkInRef = useRef(checkIn.mutateAsync);
  checkInRef.current = checkIn.mutateAsync;
  const stopScanningRef = useRef(stopScanning);
  stopScanningRef.current = stopScanning;

  useEffect(() => {
    if (qrResults.length === 0) return;
    const latest = qrResults[0];
    if (processedRef.current === latest.data) return;
    processedRef.current = latest.data;

    const doCheckIn = async () => {
      onResultRef.current({ kind: "loading" });
      stopScanningRef.current();
      try {
        const result = await checkInRef.current(latest.data);
        if (result === CheckInResult.success) {
          const member = membersRef.current?.find(
            (m) => m.qrToken === latest.data,
          );
          const now = new Date();
          onResultRef.current({
            kind: "success",
            memberName: member?.name ?? "Member",
            method: "QR Code",
            time: now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        } else {
          onResultRef.current({
            kind: "error",
            message: getErrorMessage(result),
          });
        }
      } catch {
        onResultRef.current({
          kind: "error",
          message: "Check-in failed. Please try again.",
        });
      }
    };
    doCheckIn();
  }, [qrResults]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        data-ocid="checkin.qr_scanner.canvas_target"
        className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: "1 / 1" }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-52 h-52">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-md" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-md" />
              <div
                className="absolute left-2 right-2 overflow-hidden"
                style={{ top: "8px", bottom: "8px" }}
              >
                <div
                  className="scanner-line absolute left-0 right-0 h-0.5 bg-primary"
                  style={{ boxShadow: "0 0 8px oklch(0.84 0.22 132)" }}
                />
              </div>
            </div>
          </div>
        )}

        {!isActive && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-3">
            <QrCode className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Camera preview will appear here
            </p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error.message}</span>
        </div>
      )}

      {isSupported === false && (
        <p className="text-destructive text-sm">
          Camera not supported on this device.
        </p>
      )}

      <div className="flex gap-2">
        {!isActive ? (
          <Button
            onClick={startScanning}
            disabled={!canStartScanning || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Camera className="w-4 h-4 mr-2" />
            )}
            Start Scanner
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              stopScanning();
              clearResults();
              processedRef.current = null;
            }}
          >
            Stop Scanner
          </Button>
        )}
        {isActive && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && (
          <Button variant="outline" size="icon" onClick={switchCamera}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isScanning && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Scanning for QR code…
        </p>
      )}
    </div>
  );
}

function FaceTab({
  onResult,
}: {
  onResult: (result: CheckInState) => void;
}) {
  const checkIn = useCheckInByFace();
  const { data: members, isLoading: membersLoading } = useGetAllMembers();
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: "user" });

  const handleCheckIn = async () => {
    if (!selectedMemberId) {
      toast.error("Please select your name first");
      return;
    }
    const member = members?.find((m) => m.id.toString() === selectedMemberId);
    if (!member) return;

    onResult({ kind: "loading" });
    stopCamera();
    try {
      const result = await checkIn.mutateAsync(member.id);
      if (result === CheckInResult.success) {
        const now = new Date();
        onResult({
          kind: "success",
          memberName: member.name,
          method: "Face Scan",
          time: now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      } else {
        onResult({ kind: "error", message: getErrorMessage(result) });
      }
    } catch {
      onResult({
        kind: "error",
        message: "Check-in failed. Please try again.",
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        data-ocid="checkin.face_camera.canvas_target"
        className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: "3 / 4" }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-52 h-52">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 120 120"
                fill="none"
                role="img"
                aria-label="Face scanning overlay"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="oklch(0.84 0.22 132)"
                  strokeWidth="2"
                  strokeDasharray="20 8"
                  className="scan-ring"
                  style={{ transformOrigin: "60px 60px" }}
                />
                <circle
                  cx="60"
                  cy="60"
                  r="38"
                  stroke="oklch(0.84 0.22 132 / 0.3)"
                  strokeWidth="1"
                />
                <circle
                  cx="45"
                  cy="52"
                  r="2"
                  fill="oklch(0.84 0.22 132)"
                  opacity="0.7"
                />
                <circle
                  cx="75"
                  cy="52"
                  r="2"
                  fill="oklch(0.84 0.22 132)"
                  opacity="0.7"
                />
                <path
                  d="M48 72 Q60 80 72 72"
                  stroke="oklch(0.84 0.22 132)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>
              <div
                className="absolute inset-4 rounded-full scan-glow"
                style={{ border: "2px solid oklch(0.84 0.22 132 / 0.3)" }}
              />
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <Badge
                variant="outline"
                className="text-primary border-primary/50 bg-black/50 text-xs tracking-widest uppercase"
              >
                Scanning…
              </Badge>
            </div>
          </div>
        )}

        {!isActive && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-3">
            <ScanFace className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Camera preview will appear here
            </p>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error.message}</span>
        </div>
      )}

      {isSupported === false && (
        <p className="text-destructive text-sm">
          Camera not supported on this device.
        </p>
      )}

      {!isActive && (
        <Button
          onClick={startCamera}
          disabled={isLoading}
          variant="outline"
          className="border-primary/40 text-primary hover:bg-primary/10"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          Start Camera
        </Button>
      )}

      <div className="w-full max-w-sm space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Select your name to check in
        </p>
        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
          <SelectTrigger
            data-ocid="checkin.member_select.select"
            className="bg-card border-border text-foreground"
          >
            <SelectValue
              placeholder={
                membersLoading ? "Loading members…" : "Select your name"
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {members?.map((m) => (
              <SelectItem key={m.id.toString()} value={m.id.toString()}>
                {m.name}
              </SelectItem>
            ))}
            {!membersLoading && (!members || members.length === 0) && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No members found
              </div>
            )}
          </SelectContent>
        </Select>

        <Button
          data-ocid="checkin.submit_button"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base h-12"
          onClick={handleCheckIn}
          disabled={!selectedMemberId || checkIn.isPending}
        >
          {checkIn.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Checking In…
            </>
          ) : (
            <>
              <ScanFace className="w-5 h-5 mr-2" />
              Check In
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function CheckInPage({ onNavigateAdmin }: Props) {
  const [state, setState] = useState<CheckInState>({ kind: "idle" });
  const [activeTab, setActiveTab] = useState("qr");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setState({ kind: "idle" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/gymcheck-logo-transparent.dim_120x120.png"
            alt="GymCheck"
            className="w-9 h-9"
          />
          <span className="font-display font-bold text-xl tracking-tight">
            Gym<span className="text-primary">Check</span>
          </span>
        </div>
        <button
          type="button"
          data-ocid="admin.link"
          onClick={onNavigateAdmin}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
        >
          <Settings className="w-3.5 h-3.5" />
          Admin
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-8"
        >
          <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight">
            Welcome to
            <br />
            <span className="text-primary">GymCheck</span>
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Fast, frictionless gym check-in
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {state.kind === "success" ? (
            <motion.div
              key="success"
              data-ocid="checkin.success_state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm flex flex-col items-center gap-6 py-8"
            >
              <div className="w-28 h-28 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center scan-glow">
                <CheckCircle2 className="w-14 h-14 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="font-display font-bold text-3xl text-foreground">
                  Checked In!
                </h2>
                <p className="text-primary font-semibold text-lg">
                  {state.memberName}
                </p>
                <p className="text-muted-foreground text-sm">
                  {state.time} · {state.method}
                </p>
              </div>
              <p className="text-muted-foreground text-sm text-center">
                Great workout ahead! 💪
              </p>
              <Button
                onClick={() => setState({ kind: "idle" })}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold w-full h-12"
              >
                Done
              </Button>
            </motion.div>
          ) : state.kind === "loading" ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-16"
            >
              <div
                data-ocid="checkin.loading_state"
                className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center"
              >
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <p className="text-muted-foreground">Processing check-in…</p>
            </motion.div>
          ) : (
            <motion.div
              key="tabs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.15 }}
              className="w-full max-w-sm"
            >
              {state.kind === "error" && (
                <motion.div
                  data-ocid="checkin.error_state"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive"
                >
                  <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Check-in failed</p>
                    <p className="text-sm opacity-80">{state.message}</p>
                  </div>
                </motion.div>
              )}

              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="w-full bg-card border border-border mb-6">
                  <TabsTrigger
                    value="qr"
                    data-ocid="checkin.qr_tab"
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    QR Code
                  </TabsTrigger>
                  <TabsTrigger
                    value="face"
                    data-ocid="checkin.face_tab"
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <ScanFace className="w-4 h-4 mr-2" />
                    Face Scan
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="qr">
                  <QRTab onResult={setState} />
                </TabsContent>
                <TabsContent value="face">
                  <FaceTab onResult={setState} />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
