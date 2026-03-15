import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Member {
    id: bigint;
    name: string;
    createdAt: bigint;
    email: string;
    qrToken: string;
}
export interface AttendanceRecord {
    id: bigint;
    memberId: bigint;
    method: string;
    memberName: string;
    timestamp: bigint;
}
export enum CheckInResult {
    invalidMethod = "invalidMethod",
    notFound = "notFound",
    duplicate = "duplicate",
    success = "success"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkInByFace(memberId: bigint): Promise<CheckInResult>;
    checkInByQR(qrToken: string): Promise<CheckInResult>;
    createMember(name: string, email: string): Promise<Member>;
    getAllAttendance(): Promise<Array<AttendanceRecord>>;
    getAllMembers(): Promise<Array<Member>>;
    getCallerUserRole(): Promise<UserRole>;
    getMemberAttendance(memberId: bigint): Promise<Array<AttendanceRecord>>;
    getMemberByQR(qrToken: string): Promise<Member | null>;
    getTodaysAttendance(): Promise<Array<AttendanceRecord>>;
    isCallerAdmin(): Promise<boolean>;
}
