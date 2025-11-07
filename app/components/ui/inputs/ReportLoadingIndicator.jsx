import React from 'react';

const ReportLoadingIndicator = ({ isLoading }) => {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full">
                <div className="flex flex-col items-center">
                    {/* Indicador de progresso animado */}
                    <div className="relative w-20 h-20 mb-4">
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-transparent border-purple-600 rounded-full animate-spin"></div>
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2">Gerando Relatório Clínico</h3>

                    <div className="space-y-2 w-full">
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-purple-600 rounded-full mr-3 animate-pulse"></div>
                            <p className="text-gray-600">Analisando histórico médico</p>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-purple-600 rounded-full mr-3 animate-pulse delay-300"></div>
                            <p className="text-gray-600">Processando resultados de exames</p>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-purple-600 rounded-full mr-3 animate-pulse delay-700"></div>
                            <p className="text-gray-600">Identificando tendências clínicas</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mt-4 text-center">
                        Este processo pode levar até 30 segundos enquanto nossa IA analisa todos os dados relevantes do paciente.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReportLoadingIndicator;