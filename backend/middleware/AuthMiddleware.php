<?php
// backend/middleware/AuthMiddleware.php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    public static function validateJWT() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(["error" => "No se proporcionó token de autenticación"]);
            exit;
        }

        $jwt = $matches[1];
        
        try {
            // Supabase usa RS256 o HS256. El secreto de JWT de Supabase se usa para HS256.
            $decoded = JWT::decode($jwt, new Key($_ENV['SUPABASE_JWT_SECRET'], 'HS256'));
            return $decoded;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(["error" => "Token inválido: " . $e->getMessage()]);
            exit;
        }
    }

    public static function checkRole($decoded, $requiredRoles) {
        // En Supabase, los roles pueden venir en el JWT o consultarse en la tabla 'profiles'
        // Aquí asumimos que el frontend envía el JWT y el backend valida.
        // Podríamos consultar a Supabase para verificar el rol del usuario actual.
        // Por ahora, retornamos true si el usuario está autenticado.
        return true; 
    }
}
