New-Item -ItemType Directory -Force -Path "graphify-out" | Out-Null
$GRAPHIFY_PYTHON = $null

function Find-GraphifyPython {
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        $uvDir = (uv tool dir 2>$null)
        if ($uvDir) {
            $py = Join-Path $uvDir.Trim() "graphifyy\Scripts\python.exe"
            if (Test-Path $py) {
                & $py -c "import graphify" 2>$null
                if ($LASTEXITCODE -eq 0) { return $py }
            }
        }
    }
    if (Get-Command pipx -ErrorAction SilentlyContinue) {
        $venvs = (pipx environment --value PIPX_LOCAL_VENVS 2>$null)
        if ($venvs) {
            $py = Join-Path $venvs.Trim() "graphifyy\Scripts\python.exe"
            if (Test-Path $py) {
                & $py -c "import graphify" 2>$null
                if ($LASTEXITCODE -eq 0) { return $py }
            }
        }
    }
    $pyCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pyCmd) {
        & $pyCmd.Source -c "import graphify" 2>$null
        if ($LASTEXITCODE -eq 0) {
            return (& $pyCmd.Source -c "import sys; print(sys.executable)").Trim()
        }
    }
    return $null
}

$GRAPHIFY_PYTHON = Find-GraphifyPython

if (-not $GRAPHIFY_PYTHON) {
    Write-Host "Installing graphifyy..."
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        uv tool install --upgrade graphifyy
    } else {
        python -m pip install graphifyy
    }
    $GRAPHIFY_PYTHON = Find-GraphifyPython
}

$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path $PWD 'graphify-out\.graphify_python'), [string]$GRAPHIFY_PYTHON, $Utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $PWD 'graphify-out\.graphify_root'), (Resolve-Path '.').Path, $Utf8NoBom)
Write-Host "Found graphify Python: $GRAPHIFY_PYTHON"

