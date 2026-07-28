export function homeForRole(role: string) {
  if (role === "teacher") return "/teacher/today";
  if (role === "guardian") return "/family/home";

  return "/dashboard";
}

export function canAccessPath(role: string, pathname: string) {
  const isTeacherPortalPath =
    pathname === "/teacher" || pathname.startsWith("/teacher/");

  if (pathname.startsWith("/security")) {
    return true;
  }

  if (pathname.startsWith("/docs")) {
    return role !== "guardian";
  }

  if (role === "guardian") {
    return pathname.startsWith("/family");
  }

  if (role === "teacher") {
    return (
      isTeacherPortalPath ||
      pathname.startsWith("/calendar") ||
      pathname.startsWith("/groups") ||
      pathname.startsWith("/progress")
    );
  }

  if (pathname.startsWith("/family") || isTeacherPortalPath) {
    return false;
  }

  if (pathname.startsWith("/finance") || pathname.startsWith("/payroll")) {
    return ["owner", "accountant"].includes(role);
  }

  if (pathname.startsWith("/reports")) {
    return ["owner", "academic_manager", "accountant"].includes(role);
  }

  if (pathname.startsWith("/management")) {
    return role === "owner";
  }

  if (pathname.startsWith("/progress")) {
    return ["owner", "academic_manager"].includes(role);
  }

  if (pathname.startsWith("/service-requests")) {
    return ["owner", "staff", "admissions", "academic_manager"].includes(role);
  }

  if (
    pathname.startsWith("/groups") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/teachers") ||
    pathname.startsWith("/levels")
  ) {
    return ["owner", "academic_manager"].includes(role);
  }

  if (
    pathname.startsWith("/leads") ||
    pathname.startsWith("/admissions") ||
    pathname.startsWith("/communications")
  ) {
    return ["owner", "staff", "admissions", "academic_manager"].includes(role);
  }

  return true;
}
