import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Camera, User } from 'lucide-react';

const InformacoesBasicas = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [photoURL, setPhotoURL] = useState(null);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            // Em um ambiente real, você faria upload da imagem para um servidor
            // Aqui apenas criamos uma URL temporária para visualização
            setPhotoURL(URL.createObjectURL(e.target.files[0]));
        }
    };

    return (
        <div className="font-sans">
            <div
                className="flex items-center justify-between cursor-pointer mb-1"
                onClick={toggleOpen}
            >
                <h2 className="text-blue-600 font-medium text-lg">Informações básicas</h2>
                {isOpen ? <ChevronUp className="text-blue-600" /> : <ChevronDown className="text-blue-600" />}
            </div>

            {isOpen && (
                <div className="bg-white shadow-sm mb-6" style={{ width: '1536px', height: '498px', flexShrink: 0, borderRadius: '40px' }}>
                    <div className="p-10 h-full">
                        <div className="grid grid-cols-3 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo*</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Sanguíneo*</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none appearance-none bg-white">
                                        <option>Selecione um...</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none appearance-none bg-white">
                                        <option>Selecione um...</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data De Nascimento*</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="dd/mm/aaaa"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gênero*</label>
                                    <div className="flex space-x-8 pt-2">
                                        <label className="flex items-center">
                                            <div className="relative mr-2">
                                                <div className="h-5 w-5 border-2 border-blue-500 rounded-full flex items-center justify-center">
                                                    <div className="h-2.5 w-2.5 bg-blue-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-700">Masculino</span>
                                        </label>
                                        <label className="flex items-center">
                                            <div className="relative mr-2">
                                                <div className="h-5 w-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-700">Feminino</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none appearance-none bg-white">
                                        <option>Selecione um...</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                                    <input
                                        type="email"
                                        placeholder="contato@paciente.com"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone*</label>
                                    <input
                                        type="tel"
                                        placeholder="(00) 00000-0000"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                                    <input
                                        type="text"
                                        placeholder="000.000.000-00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                                    />
                                </div>

                                <div className="flex justify-center pt-4">
                                    <div className="relative">
                                        <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                                            {photoURL ? (
                                                <img src={photoURL} alt="Foto do perfil" className="h-full w-full object-cover" />
                                            ) : (
                                                <User size={40} className="text-gray-400" />
                                            )}
                                        </div>
                                        <label
                                            htmlFor="photo-upload"
                                            className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 cursor-pointer shadow-md hover:bg-blue-600 transition"
                                        >
                                            <Camera size={16} className="text-white" />
                                        </label>
                                        <input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InformacoesBasicas;