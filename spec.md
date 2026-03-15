# GymCheck - Gym Attendance Tracker

## Current State
New project, no existing code.

## Requested Changes (Diff)

### Add
- Member check-in flow: QR code scan OR camera-based face check-in
- Attendance records stored per member with timestamp
- Admin dashboard showing today's check-ins, total attendance count, member list
- Member management: admin can create members and generate unique QR codes per member
- Role-based access: admin vs. member views

### Modify
N/A

### Remove
N/A

## Implementation Plan

### Backend (Motoko)
- `Member` type: { id, name, email, qrCode (unique token), createdAt }
- `AttendanceRecord` type: { memberId, memberName, timestamp, method (qr | face) }
- `createMember(name, email)` -> Member (admin only)
- `getMembers()` -> [Member] (admin only)
- `checkInByQR(qrToken)` -> Result (public, deduped per day)
- `checkInByFace(memberId)` -> Result (member or admin, deduped per day)
- `getTodayAttendance()` -> [AttendanceRecord] (admin only)
- `getAllAttendance()` -> [AttendanceRecord] (admin only)
- `getMemberAttendance(memberId)` -> [AttendanceRecord]
- Daily deduplication: one check-in per member per day

### Frontend
- **Check-in page** (default/public): Two modes - QR scan tab and Face scan tab
  - QR mode: activates QR scanner, reads token, calls checkInByQR
  - Face mode: activates camera, shows live feed with scan overlay animation, confirm button calls checkInByFace
  - Success/failure feedback with member name shown on success
- **Admin dashboard**: login-gated
  - Today's check-ins list with timestamps and check-in method
  - Stats: today count, total members, total check-ins
  - Member management: list, add new member, view per-member QR code (printable)
  - Attendance history table
