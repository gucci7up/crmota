<?php
// backend/config/Database.php

class Database
{
    private static $url;
    private static $apiKey;     // Identifica al proyecto (Anon Key)
    private static $authToken;  // Identifica al usuario (User JWT o Service Key)

    public static function init()
    {
        self::$url = rtrim(SUPABASE_URL, '/');
        // Por defecto, usar la clave configurada (Anon Key) para ambos
        self::$apiKey = SUPABASE_KEY;
        self::$authToken = SUPABASE_KEY;
    }

    public static function setToken($token)
    {
        // Método para sobrescribir el token de autorización (ej. con el del usuario)
        if (!empty($token)) {
            // Asegurar que tenga "Bearer "
            if (strpos($token, 'Bearer ') !== 0) {
                $token = 'Bearer ' . $token;
            }
            self::$authToken = $token;
        }
    }

    public static function query($table, $params = [])
    {
        $queryString = http_build_query($params);
        $url = self::$url . "/rest/v1/$table?$queryString";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "apikey: " . self::$apiKey,
            "Authorization: " . (strpos(self::$authToken, 'Bearer') === 0 ? self::$authToken : 'Bearer ' . self::$authToken),
            "Content-Type: application/json"
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'status' => $httpCode,
            'data' => json_decode($response, true)
        ];
    }

    public static function insert($table, $data)
    {
        $url = self::$url . "/rest/v1/$table";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "apikey: " . self::$apiKey,
            "Authorization: " . (strpos(self::$authToken, 'Bearer') === 0 ? self::$authToken : 'Bearer ' . self::$authToken),
            "Content-Type: application/json",
            "Prefer: return=representation"
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'status' => $httpCode,
            'data' => json_decode($response, true)
        ];
    }

    public static function update($table, $data, $params = [])
    {
        $queryString = http_build_query($params);
        $url = self::$url . "/rest/v1/$table?$queryString";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "apikey: " . self::$apiKey,
            "Authorization: " . (strpos(self::$authToken, 'Bearer') === 0 ? self::$authToken : 'Bearer ' . self::$authToken),
            "Content-Type: application/json",
            "Prefer: return=representation"
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'status' => $httpCode,
            'data' => json_decode($response, true)
        ];
    }
}

Database::init();
