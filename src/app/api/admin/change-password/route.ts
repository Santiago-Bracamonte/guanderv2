import { queryD1 } from "@/lib/cloudflare-d1";
import bcryptjs from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword, userId } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return Response.json(
        { message: "Contraseña actual y nueva son requeridas" },
        { status: 400 },
      );
    }

    if (!userId) {
      return Response.json(
        { message: "User ID es requerido" },
        { status: 401 },
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        { message: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    const adminId = userId;

    // Get current admin password from database
    const adminData = await queryD1<{ password_hash: string }>(
      "SELECT ud.password_hash FROM user_data ud JOIN users u ON u.fk_user_data = ud.id_user_data WHERE u.id_user = ? LIMIT 1",
      [adminId],
      { revalidate: false },
    );

    if (!adminData || adminData.length === 0) {
      return Response.json(
        { message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Hash the new password before saving
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update password in database
    await queryD1(
      "UPDATE user_data SET password_hash = ? WHERE id_user_data = (SELECT fk_user_data FROM users WHERE id_user = ?)",
      [hashedPassword, adminId],
      { revalidate: false },
    );

    // Verify the update was successful by querying the password
    const verifyResult = await queryD1<{ password_hash: string }>(
      "SELECT ud.password_hash FROM user_data ud JOIN users u ON u.fk_user_data = ud.id_user_data WHERE u.id_user = ? LIMIT 1",
      [adminId],
      { revalidate: false },
    );

    if (!verifyResult || verifyResult.length === 0) {
      return Response.json(
        { message: "Error al verificar la contraseña actualizada" },
        { status: 500 },
      );
    }

    // Verify the hash actually changed
    const newHashMatches = await bcryptjs.compare(
      newPassword,
      verifyResult[0].password_hash,
    );
    if (!newHashMatches) {
      return Response.json(
        { message: "Error: La contraseña no se guardó correctamente" },
        { status: 500 },
      );
    }

    return Response.json(
      { message: "Contraseña actualizada correctamente", success: true },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error changing password:", error);
    return Response.json(
      { message: "Error al cambiar la contraseña" },
      { status: 500 },
    );
  }
}
