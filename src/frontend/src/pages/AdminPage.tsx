import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  CalendarCheck,
  Loader2,
  LogOut,
  Plus,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateMember,
  useGetAllAttendance,
  useGetAllMembers,
  useGetTodaysAttendance,
  useIsCallerAdmin,
} from "../hooks/useQueries";

interface Props {
  onNavigateBack: () => void;
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  return new Date(ms).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MethodBadge({ method }: { method: string }) {
  const isQR = method.toLowerCase().includes("qr");
  return (
    <Badge
      variant="outline"
      className={
        isQR
          ? "border-primary/50 text-primary bg-primary/10"
          : "border-blue-500/50 text-blue-400 bg-blue-500/10"
      }
    >
      {isQR ? <QrCode className="w-3 h-3 mr-1" /> : null}
      {method}
    </Badge>
  );
}

function LoginScreen({ onBack }: { onBack: () => void }) {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 w-full max-w-sm"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="font-display font-bold text-3xl">Admin Access</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Sign in to manage GymCheck
          </p>
        </div>
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12"
          onClick={login}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Check-in
        </button>
      </motion.div>
    </div>
  );
}

function AccessDeniedScreen({
  onBack,
  onLogout,
}: { onBack: () => void; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center space-y-2">
        <h2 className="font-display font-bold text-2xl text-destructive">
          Access Denied
        </h2>
        <p className="text-muted-foreground text-sm">
          You don't have admin privileges.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button variant="destructive" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function AdminPage({ onNavigateBack }: Props) {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: members, isLoading: membersLoading } = useGetAllMembers();
  const { data: todaysAttendance, isLoading: todayLoading } =
    useGetTodaysAttendance();
  const { data: allAttendance, isLoading: allLoading } = useGetAllAttendance();
  const createMember = useCreateMember();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    onNavigateBack();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    try {
      await createMember.mutateAsync({
        name: name.trim(),
        email: email.trim(),
      });
      toast.success(`Member "${name}" added successfully!`);
      setName("");
      setEmail("");
    } catch {
      toast.error("Failed to add member. Please try again.");
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onBack={onNavigateBack} />;
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AccessDeniedScreen onBack={onNavigateBack} onLogout={handleLogout} />
    );
  }

  const totalCheckins = todaysAttendance?.length ?? 0;
  const totalMembers = members?.length ?? 0;
  const totalAll = allAttendance?.length ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-lg">
              Admin <span className="text-primary">Dashboard</span>
            </span>
          </div>
        </div>
        <Button
          data-ocid="admin.logout_button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Logout
        </Button>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <CalendarCheck className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Today
                </span>
              </div>
              {todayLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="font-display font-bold text-2xl text-primary">
                  {totalCheckins}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Check-ins</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Members
                </span>
              </div>
              {membersLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="font-display font-bold text-2xl text-foreground">
                  {totalMembers}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  All Time
                </span>
              </div>
              {allLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="font-display font-bold text-2xl text-foreground">
                  {totalAll}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Records</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="today">
            <TabsList className="w-full bg-card border border-border mb-4 grid grid-cols-4">
              <TabsTrigger
                value="today"
                data-ocid="admin.today_tab.tab"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              >
                Today
              </TabsTrigger>
              <TabsTrigger
                value="members"
                data-ocid="admin.members_tab.tab"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              >
                Members
              </TabsTrigger>
              <TabsTrigger
                value="add"
                data-ocid="admin.add_tab.tab"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              >
                Add
              </TabsTrigger>
              <TabsTrigger
                value="history"
                data-ocid="admin.history_tab.tab"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              >
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-display font-semibold">
                    Today's Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : !todaysAttendance || todaysAttendance.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No check-ins today yet
                    </div>
                  ) : (
                    <Table data-ocid="admin.attendance.table">
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>#</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todaysAttendance.map((record, idx) => (
                          <TableRow
                            key={record.id.toString()}
                            className="border-border"
                          >
                            <TableCell className="text-muted-foreground text-xs">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {record.memberName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatTime(record.timestamp)}
                            </TableCell>
                            <TableCell>
                              <MethodBadge method={record.method} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-display font-semibold">
                    All Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {membersLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : !members || members.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No members registered yet
                    </div>
                  ) : (
                    <Table data-ocid="admin.members.table">
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>QR Token</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member, idx) => (
                          <TableRow
                            key={member.id.toString()}
                            className="border-border"
                          >
                            <TableCell className="text-muted-foreground text-xs">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {member.name}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {member.email}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">
                                {member.qrToken.slice(0, 12)}…
                              </code>
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    data-ocid={`admin.view_qr.button.${idx + 1}`}
                                    variant="outline"
                                    size="sm"
                                    className="border-primary/30 text-primary hover:bg-primary/10 text-xs"
                                  >
                                    <QrCode className="w-3.5 h-3.5 mr-1" />
                                    View QR
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border max-w-sm">
                                  <DialogHeader>
                                    <DialogTitle className="font-display">
                                      {member.name}'s QR Token
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="flex flex-col items-center gap-4 py-4">
                                    <div className="w-full p-4 rounded-xl bg-background border border-border">
                                      <p className="text-xs text-muted-foreground mb-2">
                                        QR Token:
                                      </p>
                                      <code className="text-sm text-primary font-mono break-all leading-relaxed">
                                        {member.qrToken}
                                      </code>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                      Share this token with the member to
                                      generate their QR code
                                    </p>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="add">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-display font-semibold">
                    Add New Member
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="member-name" className="text-sm">
                        Full Name
                      </Label>
                      <Input
                        id="member-name"
                        data-ocid="admin.add_member.input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="bg-background border-border"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="member-email" className="text-sm">
                        Email
                      </Label>
                      <Input
                        id="member-email"
                        data-ocid="admin.add_member.email.input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="bg-background border-border"
                        required
                      />
                    </div>
                    <Button
                      data-ocid="admin.add_member.submit_button"
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-11"
                      disabled={
                        createMember.isPending || !name.trim() || !email.trim()
                      }
                    >
                      {createMember.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Adding…
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Member
                        </>
                      )}
                    </Button>
                    {createMember.isError && (
                      <p className="text-destructive text-sm text-center">
                        Failed to add member.
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-display font-semibold">
                    Full History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : !allAttendance || allAttendance.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No attendance records yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead>#</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Method</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...allAttendance]
                            .sort((a, b) => Number(b.timestamp - a.timestamp))
                            .map((record, idx) => (
                              <TableRow
                                key={record.id.toString()}
                                className="border-border"
                              >
                                <TableCell className="text-muted-foreground text-xs">
                                  {idx + 1}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {record.memberName}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatTime(record.timestamp)}
                                </TableCell>
                                <TableCell>
                                  <MethodBadge method={record.method} />
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
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
