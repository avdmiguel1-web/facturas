import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AlertCircle, RefreshCw, Check } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export default function ExchangeRateWidget({ onRateChange }) {
    const [rate, setRate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [manualRate, setManualRate] = useState('');
    const [message, setMessage] = useState('');
    const [lastUpdate, setLastUpdate] = useState(null);

    const fetchExchangeRate = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/exchange-rate');
            setRate(response.data.rate);
            setLastUpdate(response.data.last_update);
            setManualRate(response.data.rate.toString());
        } catch (err) {
            setError('Error al obtener la tasa de cambio');
            console.error('Error fetching exchange rate:', err);
        } finally {
            setLoading(false);
        }
    };

    const syncExchangeRate = async () => {
        setLoading(true);
        setError(null);
        setMessage('');
        try {
            const response = await api.post('/exchange-rate/sync');
            setRate(response.data.rate);
            setLastUpdate(response.data.last_update);
            setManualRate(response.data.rate.toString());
            if (onRateChange) onRateChange(response.data.rate);
            setMessage(`✓ Tasa sincronizada: ${response.data.formatted_rate}`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError('Error al sincronizar la tasa del BCV');
            console.error('Error syncing exchange rate:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateExchangeRate = async () => {
        if (!manualRate || parseFloat(manualRate) <= 0) {
            setError('Por favor ingresa una tasa válida');
            return;
        }

        setLoading(true);
        setError(null);
        setMessage('');
        try {
            const response = await api.post('/exchange-rate', {
                rate: parseFloat(manualRate),
            });
            setRate(response.data.rate);
            setLastUpdate(response.data.last_update);
            if (onRateChange) onRateChange(response.data.rate);
            setMessage(`✓ Tasa actualizada: ${response.data.formatted_rate}`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al actualizar la tasa');
            console.error('Error updating exchange rate:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExchangeRate();
    }, []);

    if (!rate) {
        return null;
    }

    return (
        <Card className="w-full bg-slate-50 border-slate-200">
            <CardHeader className="pb-3 bg-slate-100 border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Tasa de Cambio USD/VEF</CardTitle>
                        <CardDescription className="text-sm mt-1">
                            Banco Central de Venezuela
                        </CardDescription>
                    </div>
                    <Button
                        onClick={syncExchangeRate}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Sincronizar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Display actual rate */}
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="text-sm font-medium text-slate-600 mb-1">Tasa Actual</div>
                    <div className="text-3xl font-bold text-slate-900">
                        {rate ? rate.toFixed(2) : '0.00'} VEF
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                        por 1 USD
                    </div>
                    {lastUpdate && (
                        <div className="text-xs text-slate-400 mt-2">
                            Actualizado: {new Date(lastUpdate).toLocaleString('es-VE')}
                        </div>
                    )}
                </div>

                {/* Error alert */}
                {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Success message */}
                {message && (
                    <Alert className="border-green-200 bg-green-50">
                        <Check className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">{message}</AlertDescription>
                    </Alert>
                )}

                {/* Manual update form */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-black">
                        Actualizar tasa manualmente
                    </label>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Ej: 490.04"
                            value={manualRate}
                            onChange={(e) => setManualRate(e.target.value)}
                            disabled={loading}
                            className="text-sm border-slate-300 bg-white text-black shadow-sm focus:border-blue-500 focus:ring-blue-100 focus:ring-2"
                        />
                        <Button
                            onClick={updateExchangeRate}
                            disabled={loading}
                            className="whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-300"
                        >
                            {loading ? 'Actualizando...' : 'Actualizar'}
                        </Button>
                    </div>
                </div>

                {/* Quick conversion info */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs">
                    <div className="font-medium text-gray-700 mb-2">Conversión de ejemplo:</div>
                    <div className="space-y-1 text-gray-600">
                        <div>1 USD = {rate?.toFixed(2)} VEF</div>
                        <div>100 USD = {(100 * rate).toFixed(2)} VEF</div>
                        <div>1000 USD = {(1000 * rate).toFixed(2)} VEF</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
