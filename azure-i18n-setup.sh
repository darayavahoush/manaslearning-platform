#!/usr/bin/env bash
# Creates the Azure Translator and Speech resources for the language feature and prints the keys once.
# Usage: bash azure-i18n-setup.sh <resource-group> [translator-sku] [speech-sku]
#   translator-sku: F0 (free, 2M characters/month) or S1 (pay as you go). Default F0.
#   speech-sku:     F0 (free, small monthly quota) or S0 (pay as you go). Default S0.
set -euo pipefail
RG="${1:?Give the resource group, e.g. bash azure-i18n-setup.sh my-resource-group}"
TSKU="${2:-F0}"; SSKU="${3:-S0}"
SUFFIX="$(printf '%s' "$RG" | cksum | cut -d' ' -f1)"
TNAME="manas-translator-$SUFFIX"; SNAME="manas-speech-$SUFFIX"
az cognitiveservices account create -n "$TNAME" -g "$RG" --kind TextTranslation --sku "$TSKU" -l global --yes -o none
az cognitiveservices account create -n "$SNAME" -g "$RG" --kind SpeechServices --sku "$SSKU" -l centralindia --yes -o none
echo
echo "AZURE_TRANSLATOR_KEY=$(az cognitiveservices account keys list -n "$TNAME" -g "$RG" --query key1 -o tsv)"
echo "AZURE_TRANSLATOR_REGION=global"
echo "AZURE_SPEECH_KEY=$(az cognitiveservices account keys list -n "$SNAME" -g "$RG" --query key1 -o tsv)"
echo "AZURE_SPEECH_REGION=centralindia"
echo
echo "Treat the keys like passwords. Add each with: vercel env add NAME production   (and SARVAM_API_KEY from dashboard.sarvam.ai)"
