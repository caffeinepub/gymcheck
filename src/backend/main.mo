import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Member = {
    id : Nat;
    name : Text;
    email : Text;
    qrToken : Text;
    createdAt : Int;
  };

  module Member {
    public func compare(member1 : Member, member2 : Member) : Order.Order {
      Nat.compare(member1.id, member2.id);
    };
  };

  type AttendanceRecord = {
    id : Nat;
    memberId : Nat;
    memberName : Text;
    timestamp : Int;
    method : Text;
  };

  module AttendanceRecord {
    public func compare(record1 : AttendanceRecord, record2 : AttendanceRecord) : Order.Order {
      switch (Int.compare(record2.timestamp, record1.timestamp)) {
        case (#equal) { Nat.compare(record1.id, record2.id) };
        case (order) { order };
      };
    };
  };

  type CheckInResult = {
    #success;
    #duplicate;
    #notFound;
    #invalidMethod;
  };

  var memberIdCounter = 0;
  var attendanceIdCounter = 0;

  let membersById = Map.empty<Nat, Member>();
  let membersByQR = Map.empty<Text, Nat>();
  let attendanceRecords = Map.empty<Nat, AttendanceRecord>();

  func dayTimestamp(timestamp : Int) : Int {
    let millisPerDay = 24 * 60 * 60 * 1000;
    let timestampMillis = timestamp / 1_000_000;
    let dayMillis = timestampMillis - (timestampMillis % millisPerDay);
    dayMillis * 1_000_000;
  };

  func generateQRToken(id : Nat) : Text {
    let now = Time.now();
    "token-" # id.toText() # "-" # now.toText();
  };

  public shared ({ caller }) func createMember(name : Text, email : Text) : async Member {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create members");
    };

    memberIdCounter += 1;
    let qrToken = generateQRToken(memberIdCounter);
    let member : Member = {
      id = memberIdCounter;
      name;
      email;
      qrToken;
      createdAt = Time.now();
    };
    membersById.add(member.id, member);
    membersByQR.add(qrToken, member.id);
    member;
  };

  public query ({ caller }) func getAllMembers() : async [Member] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all members");
    };
    membersById.values().toArray().sort();
  };

  public query ({ caller }) func getMemberByQR(qrToken : Text) : async ?Member {
    switch (membersByQR.get(qrToken)) {
      case (null) { null };
      case (?memberId) { membersById.get(memberId) };
    };
  };

  func checkDuplicateAttendance(memberId : Nat, method : Text) : Bool {
    let today = dayTimestamp(Time.now());
    for ((_, record) in attendanceRecords.entries()) {
      if (record.memberId == memberId and dayTimestamp(record.timestamp) == today and record.method == method) {
        return true;
      };
    };
    false;
  };

  func createAttendanceRecord(memberId : Nat, method : Text) : AttendanceRecord {
    attendanceIdCounter += 1;
    let member = switch (membersById.get(memberId)) {
      case (?m) { m };
      case (null) { Runtime.trap("Member not found") };
    };

    {
      id = attendanceIdCounter;
      memberId;
      memberName = member.name;
      timestamp = Time.now();
      method;
    };
  };

  public shared ({ caller }) func checkInByQR(qrToken : Text) : async CheckInResult {
    switch (membersByQR.get(qrToken)) {
      case (null) { #notFound };
      case (?memberId) {
        if (checkDuplicateAttendance(memberId, "qr")) {
          #duplicate;
        } else {
          let record = createAttendanceRecord(memberId, "qr");
          attendanceRecords.add(record.id, record);
          #success;
        };
      };
    };
  };

  public shared ({ caller }) func checkInByFace(memberId : Nat) : async CheckInResult {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can check in via face");
    };

    switch (membersById.get(memberId)) {
      case (null) { #notFound };
      case (?_) {
        if (checkDuplicateAttendance(memberId, "face")) {
          #duplicate;
        } else {
          let record = createAttendanceRecord(memberId, "face");
          attendanceRecords.add(record.id, record);
          #success;
        };
      };
    };
  };

  public query ({ caller }) func getTodaysAttendance() : async [AttendanceRecord] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view attendance");
    };

    let today = dayTimestamp(Time.now());
    attendanceRecords.values().toArray().filter(
      func(record) {
        dayTimestamp(record.timestamp) == today;
      }
    ).sort();
  };

  public query ({ caller }) func getAllAttendance() : async [AttendanceRecord] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view attendance");
    };
    attendanceRecords.values().toArray().sort();
  };

  public query ({ caller }) func getMemberAttendance(memberId : Nat) : async [AttendanceRecord] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view member attendance");
    };

    attendanceRecords.values().toArray().filter(
      func(record) {
        record.memberId == memberId;
      }
    ).sort();
  };
};
