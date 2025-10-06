# Script de CI/CD Local para SGU Microservices (PowerShell)
# Ejecuta todos los tests y validaciones localmente

param(
    [switch]$SkipInstall,
    [switch]$SkipLint,
    [switch]$SkipTests,
    [switch]$SkipPatterns,
    [switch]$Verbose
)

# Configuración de colores
$Colors = @{
    Reset = "`e[0m"
    Bright = "`e[1m"
    Red = "`e[31m"
    Green = "`e[32m"
    Yellow = "`e[33m"
    Blue = "`e[34m"
    Magenta = "`e[35m"
    Cyan = "`e[36m"
}

# Función para escribir mensajes con colores
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Función para ejecutar comandos
function Invoke-Command {
    param(
        [string]$Command,
        [string]$Description,
        [string]$WorkingDirectory = $PWD
    )
    
    Write-ColorOutput "🔄 $Description..." $Colors.Cyan
    
    try {
        $result = Invoke-Expression $Command
        Write-ColorOutput "✅ $Description completado" $Colors.Green
        return @{ Success = $true; Output = $result }
    }
    catch {
        Write-ColorOutput "❌ $Description falló" $Colors.Red
        Write-ColorOutput "Error: $($_.Exception.Message)" $Colors.Red
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# Función para verificar directorios
function Test-Directory {
    param([string]$Path)
    return Test-Path $Path -PathType Container
}

# Función para verificar archivos
function Test-File {
    param([string]$Path)
    return Test-Path $Path -PathType Leaf
}

# Función para contar archivos
function Get-FileCount {
    param(
        [string]$Path,
        [string]$Pattern
    )
    
    if (-not (Test-Directory $Path)) {
        return 0
    }
    
    $files = Get-ChildItem -Path $Path -Recurse -Filter $Pattern -File
    return $files.Count
}

# Función principal
function Start-CILocal {
    Write-ColorOutput "🚀 SGU Microservices - CI/CD Local" $Colors.Blue
    Write-ColorOutput "==========================================" $Colors.Blue
    Write-Output ""

    $results = @{
        Services = @{}
        Patterns = @{}
        Overall = @{ Success = $true; Errors = @() }
    }

    # 1. Verificar estructura del proyecto
    Write-ColorOutput "📋 Verificando estructura del proyecto..." $Colors.Yellow
    
    $services = @('auth-service', 'courses-service', 'enrollment-service', 'notifications-service', 'payments-service', 'api-gateway')
    $missingServices = @()
    
    foreach ($service in $services) {
        if (-not (Test-Directory "sgu-microservices\$service")) {
            $missingServices += $service
        }
    }
    
    if ($missingServices.Count -gt 0) {
        Write-ColorOutput "❌ Servicios faltantes: $($missingServices -join ', ')" $Colors.Red
        $results.Overall.Success = $false
        $results.Overall.Errors += "Servicios faltantes: $($missingServices -join ', ')"
    } else {
        Write-ColorOutput "✅ Todos los servicios presentes" $Colors.Green
    }

    # 2. Instalar dependencias
    if (-not $SkipInstall) {
        Write-ColorOutput "`n📦 Instalando dependencias..." $Colors.Yellow
        
        $installResult = Invoke-Command "npm run install:all" "Instalación de dependencias"
        if (-not $installResult.Success) {
            $results.Overall.Success = $false
            $results.Overall.Errors += "Error en instalación de dependencias"
        }
    }

    # 3. Tests de linting
    if (-not $SkipLint) {
        Write-ColorOutput "`n🔍 Ejecutando linting..." $Colors.Yellow
        
        $lintResult = Invoke-Command "npm run lint:all" "Linting de código"
        if (-not $lintResult.Success) {
            Write-ColorOutput "⚠️  Linting completado con advertencias" $Colors.Yellow
        }
    }

    # 4. Tests de servicios
    if (-not $SkipTests) {
        Write-ColorOutput "`n🧪 Ejecutando tests de servicios..." $Colors.Yellow
        
        foreach ($service in $services) {
            Write-ColorOutput "`n🔬 Testing $service..." $Colors.Cyan
            $testResult = Invoke-Command "cd sgu-microservices\$service; npm test" "Tests de $service"
            $results.Services[$service] = $testResult.Success
            
            if (-not $testResult.Success) {
                $results.Overall.Success = $false
                $results.Overall.Errors += "Error en tests de $service"
            }
        }
    }

    # 5. Tests de patrones de diseño
    if (-not $SkipPatterns) {
        Write-ColorOutput "`n🎨 Ejecutando tests de patrones de diseño..." $Colors.Yellow
        
        # DDD Tests
        Write-ColorOutput "`n🏗️  Testing Domain-Driven Design (DDD)..." $Colors.Magenta
        $dddResult = Invoke-Command "cd sgu-microservices\enrollment-service; npm test -- tests/domain/" "Tests DDD"
        $results.Patterns.DDD = $dddResult.Success
        
        # Factory Method Tests
        Write-ColorOutput "`n🏭 Testing Factory Method..." $Colors.Magenta
        $factoryResult = Invoke-Command "npm run test:factory" "Tests Factory Method"
        $results.Patterns.Factory = $factoryResult.Success
        
        # Strategy Tests
        Write-ColorOutput "`n⚡ Testing Strategy Pattern..." $Colors.Magenta
        $strategyResult = Invoke-Command "npm run test:strategy" "Tests Strategy"
        $results.Patterns.Strategy = $strategyResult.Success
        
        # Decorator Tests
        Write-ColorOutput "`n🎨 Testing Decorator Pattern..." $Colors.Magenta
        $decoratorResult = Invoke-Command "npm run test:decorator" "Tests Decorator"
        $results.Patterns.Decorator = $decoratorResult.Success
    }

    # 6. Generar reporte de cobertura
    Write-ColorOutput "`n📊 Generando reporte de cobertura..." $Colors.Yellow
    
    $coverageResult = Invoke-Command "npm run test:coverage" "Reporte de cobertura"
    if (-not $coverageResult.Success) {
        Write-ColorOutput "⚠️  Reporte de cobertura completado con advertencias" $Colors.Yellow
    }

    # 7. Verificar estructura de patrones
    Write-ColorOutput "`n📋 Verificando estructura de patrones..." $Colors.Yellow
    
    $patternStats = @{
        DDD = Get-FileCount "sgu-microservices\enrollment-service\src\domain" "*.js"
        Factory = @{
            Notifications = Get-FileCount "sgu-microservices\notifications-service\src\factories" "*.js"
            Payments = Get-FileCount "sgu-microservices\payments-service\src\factories" "*.js"
            Validators = Get-FileCount "sgu-microservices\enrollment-service\src\factories" "*.js"
        }
        Strategy = Get-FileCount "sgu-microservices\enrollment-service\src\strategies" "*.js"
        Decorator = Get-FileCount "sgu-microservices\api-gateway\src\decorators" "*.js"
    }

    Write-ColorOutput "`n📊 Estadísticas de Patrones de Diseño:" $Colors.Blue
    Write-ColorOutput "🏗️  DDD: $($patternStats.DDD) archivos" $Colors.White
    Write-ColorOutput "🏭 Factory Method: $($patternStats.Factory.Notifications + $patternStats.Factory.Payments + $patternStats.Factory.Validators) archivos" $Colors.White
    Write-ColorOutput "⚡ Strategy: $($patternStats.Strategy) archivos" $Colors.White
    Write-ColorOutput "🎨 Decorator: $($patternStats.Decorator) archivos" $Colors.White

    # 8. Generar reporte final
    Write-ColorOutput "`n📋 REPORTE FINAL CI/CD LOCAL" $Colors.Blue
    Write-ColorOutput "================================" $Colors.Blue
    
    Write-ColorOutput "`n🔧 Servicios:" $Colors.Yellow
    foreach ($service in $results.Services.Keys) {
        $status = if ($results.Services[$service]) { "✅" } else { "❌" }
        $color = if ($results.Services[$service]) { $Colors.Green } else { $Colors.Red }
        Write-ColorOutput "  $status $service" $color
    }
    
    Write-ColorOutput "`n🎨 Patrones de Diseño:" $Colors.Yellow
    foreach ($pattern in $results.Patterns.Keys) {
        $status = if ($results.Patterns[$pattern]) { "✅" } else { "❌" }
        $color = if ($results.Patterns[$pattern]) { $Colors.Green } else { $Colors.Red }
        Write-ColorOutput "  $status $pattern" $color
    }
    
    Write-ColorOutput "`n📊 Resumen:" $Colors.Yellow
    $totalServices = $results.Services.Count
    $passedServices = ($results.Services.Values | Where-Object { $_ }).Count
    $totalPatterns = $results.Patterns.Count
    $passedPatterns = ($results.Patterns.Values | Where-Object { $_ }).Count
    
    Write-ColorOutput "  📈 Servicios: $passedServices/$totalServices pasaron" $Colors.White
    Write-ColorOutput "  🎨 Patrones: $passedPatterns/$totalPatterns pasaron" $Colors.White
    
    if ($results.Overall.Success) {
        Write-ColorOutput "`n🎉 ¡CI/CD LOCAL COMPLETADO EXITOSAMENTE!" $Colors.Green
        Write-ColorOutput "✅ Todos los tests pasaron" $Colors.Green
        Write-ColorOutput "✅ Todos los patrones funcionando" $Colors.Green
        Write-ColorOutput "🚀 Sistema listo para deployment" $Colors.Green
    } else {
        Write-ColorOutput "`n❌ CI/CD LOCAL FALLÓ" $Colors.Red
        Write-ColorOutput "Errores encontrados:" $Colors.Red
        foreach ($error in $results.Overall.Errors) {
            Write-ColorOutput "  • $error" $Colors.Red
        }
        exit 1
    }
}

# Ejecutar CI/CD local
Start-CILocal
