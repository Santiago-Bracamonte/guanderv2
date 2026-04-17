import { queryD1 } from "@/lib/cloudflare-d1";
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Read the token cookie from the request
    const tokenCookie = request.cookies.get("token")?.value;

    if (!tokenCookie) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verify the token
    const decoded = verifyToken(tokenCookie);
    if (!decoded || !decoded.id) {
      return Response.json({ error: "Token inválido" }, { status: 401 });
    }

    // Fetch user data to confirm it exists
    const results = await queryD1(
      `SELECT u.id_user, ud.name, ud.email
       FROM users u
       JOIN user_data ud ON u.fk_user_data = ud.id_user_data
       WHERE u.id_user = ? LIMIT 1`,
      [decoded.id],
      { revalidate: false },
    );

    if (results.length === 0) {
      return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return Response.json({
      success: true,
      userId: decoded.id,
      email: results[0].email,
      name: results[0].name,
    });
  } catch (error) {
    console.error("Error in auth status:", error);
    return Response.json(
      { error: "Error al verificar sesión" },
      { status: 500 },
    );
  }
}
