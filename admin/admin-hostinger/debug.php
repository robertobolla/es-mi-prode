<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== DIAGNÓSTICO DE ARCHIVOS EN EL SERVIDOR ===\n\n";

function get_perms($path) {
    $perms = fileperms($path);
    if (($perms & 0xC000) == 0xC000) { $info = 's'; }
    elseif (($perms & 0xA000) == 0xA000) { $info = 'l'; }
    elseif (($perms & 0x8000) == 0x8000) { $info = '-'; }
    elseif (($perms & 0x6000) == 0x6000) { $info = 'b'; }
    elseif (($perms & 0x4000) == 0x4000) { $info = 'd'; }
    elseif (($perms & 0x2000) == 0x2000) { $info = 'c'; }
    elseif (($perms & 0x1000) == 0x1000) { $info = 'p'; }
    else { $info = 'u'; }

    $info .= (($perms & 0x0100) ? 'r' : '-');
    $info .= (($perms & 0x0080) ? 'w' : '-');
    $info .= (($perms & 0x0040) ? (($perms & 0x0800) ? 's' : 'x' ) : (($perms & 0x0800) ? 'S' : '-'));

    $info .= (($perms & 0x0020) ? 'r' : '-');
    $info .= (($perms & 0x0010) ? 'w' : '-');
    $info .= (($perms & 0x0008) ? (($perms & 0x0400) ? 's' : 'x' ) : (($perms & 0x0400) ? 'S' : '-'));

    $info .= (($perms & 0x0004) ? 'r' : '-');
    $info .= (($perms & 0x0002) ? 'w' : '-');
    $info .= (($perms & 0x0001) ? (($perms & 0x0200) ? 't' : 'x' ) : (($perms & 0x0200) ? 'T' : '-'));

    return $info . " (" . sprintf('%04o', $perms & 0x7FFF) . ")";
}

function scan_dir_recursive($dir, $prefix = '') {
    if (!is_dir($dir)) {
        echo "{$prefix}❌ Error: No es un directorio válido.\n";
        return;
    }
    
    $files = scandir($dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $path = $dir . '/' . $file;
        $perms = get_perms($path);
        
        if (is_dir($path)) {
            echo "{$prefix}📁 [DIR]  {$file} - Permisos: {$perms}\n";
            scan_dir_recursive($path, $prefix . '  ');
        } else {
            $size = filesize($path);
            echo "{$prefix}📄 [FILE] {$file} ({$size} bytes) - Permisos: {$perms}\n";
        }
    }
}

echo "Carpeta raíz actual: " . __DIR__ . "\n";
echo "Permisos de la carpeta raíz: " . get_perms(__DIR__) . "\n\n";

echo "--- Listado de Archivos y Carpetas ---\n";
scan_dir_recursive(__DIR__);
?>
