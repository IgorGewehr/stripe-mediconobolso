import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Plus, X } from 'lucide-react';

const CondicoesClinicas = () => {
    // Estados
    const [isOpen, setIsOpen] = useState(true);
    const [medicamentos, setMedicamentos] = useState(['Metformina 500mg', 'Losartana Potássica 50mg']);
    const [doencas, setDoencas] = useState(['Diabetes', 'Fumante', 'Internado']);
    const [alergias, setAlergias] = useState(['Poeira', 'Amoxilina']);
    const [cirurgias, setCirurgias] = useState(['Colecistectomia']);
    const [atividadesFisicas, setAtividadesFisicas] = useState(['Caminhadas', 'Musculação']);
    const [consomeAlcool, setConsomeAlcool] = useState('Sim');
    const [eFumante, setEFumante] = useState('Sim');

    // Estados para novos itens
    const [novoMedicamento, setNovoMedicamento] = useState('');
    const [novaDoenca, setNovaDoenca] = useState('');
    const [novaAlergia, setNovaAlergia] = useState('');
    const [novaCirurgia, setNovaCirurgia] = useState('');
    const [novaAtividadeFisica, setNovaAtividadeFisica] = useState('');

    // Refs para focus nos inputs após adicionar
    const medicamentoInputRef = useRef(null);
    const doencaInputRef = useRef(null);
    const alergiaInputRef = useRef(null);
    const cirurgiaInputRef = useRef(null);
    const atividadeInputRef = useRef(null);

    // Alternar visibilidade do conteúdo
    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    // Adicionar novo item genérico
    const addItem = (list, setList, newItem, setNewItem, inputRef) => {
        if (newItem.trim() !== '') {
            setList([...list, newItem.trim()]);
            setNewItem('');

            // Foco no input após adicionar item
            if (inputRef && inputRef.current) {
                setTimeout(() => {
                    inputRef.current.focus();
                }, 10);
            }
        }
    };

    // Remover item de uma lista
    const removeItem = (list, setList, index) => {
        const newList = [...list];
        newList.splice(index, 1);
        setList(newList);
    };

    // Cores para os cards de tags baseadas no tipo
    const getTagStyle = (category, item) => {
        if (category === 'doencas') {
            if (item === 'Diabetes')
                return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
            if (item === 'Fumante')
                return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' };
            if (item === 'Internado')
                return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' };
        }
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    };

    // Lidar com tecla Enter nos inputs
    const handleKeyDown = (e, list, setList, newItem, setNewItem, inputRef) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItem(list, setList, newItem, setNewItem, inputRef);
        }
    };

    // JSX para um campo de entrada com botão de adição
    const InputField = ({ label, value, onChange, onKeyDown, placeholder, onAdd, inputRef }) => (
        <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder || "Digite e pressione Enter"}
                />
                <button
                    className="absolute right-2 top-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600 transition-colors"
                    onClick={onAdd}
                    aria-label={`Adicionar ${label}`}
                >
                    <Plus size={20} />
                </button>
            </div>
        </div>
    );

    // JSX para a lista de tags
    const TagList = ({ items, category, onRemove }) => (
        <div className="flex flex-wrap gap-2 mt-2">
            {items.map((item, index) => {
                const style = getTagStyle(category, item);
                return (
                    <div
                        key={index}
                        className={`${style.bg} ${style.border} border rounded-full px-3 py-1.5 flex items-center space-x-1 shadow-sm`}
                    >
                        <span className={`text-sm font-medium ${style.text}`}>{item}</span>
                        <button
                            className={`${style.text} opacity-70 hover:opacity-100`}
                            onClick={() => onRemove(index)}
                            aria-label={`Remover ${item}`}
                        >
                            <X size={16} />
                        </button>
                    </div>
                );
            })}
        </div>
    );

    // JSX do componente principal
    return (
        <div className="font-sans bg-white rounded-xl shadow-sm" style={{ width: '732px', flexShrink: 0 }}>
            {/* Cabeçalho */}
            <div
                className="flex items-center justify-between cursor-pointer p-4 bg-blue-50 rounded-t-xl"
                onClick={toggleOpen}
            >
                <h2 className="text-blue-600 font-medium text-lg">Condições Clínicas</h2>
                <div className="text-blue-600">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Conteúdo expansível */}
            {isOpen && (
                <div className="bg-white p-6 rounded-b-xl transition-all">
                    {/* Medicamentos */}
                    <InputField
                        label="Medicamentos"
                        value={novoMedicamento}
                        onChange={(e) => setNovoMedicamento(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, medicamentos, setMedicamentos, novoMedicamento, setNovoMedicamento, medicamentoInputRef)}
                        onAdd={() => addItem(medicamentos, setMedicamentos, novoMedicamento, setNovoMedicamento, medicamentoInputRef)}
                        inputRef={medicamentoInputRef}
                    />
                    <TagList
                        items={medicamentos}
                        category="medicamentos"
                        onRemove={(index) => removeItem(medicamentos, setMedicamentos, index)}
                    />

                    {/* Doenças */}
                    <InputField
                        label="Doenças"
                        value={novaDoenca}
                        onChange={(e) => setNovaDoenca(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, doencas, setDoencas, novaDoenca, setNovaDoenca, doencaInputRef)}
                        onAdd={() => addItem(doencas, setDoencas, novaDoenca, setNovaDoenca, doencaInputRef)}
                        inputRef={doencaInputRef}
                    />
                    <TagList
                        items={doencas}
                        category="doencas"
                        onRemove={(index) => removeItem(doencas, setDoencas, index)}
                    />

                    {/* Alergias */}
                    <InputField
                        label="Alergias"
                        value={novaAlergia}
                        onChange={(e) => setNovaAlergia(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, alergias, setAlergias, novaAlergia, setNovaAlergia, alergiaInputRef)}
                        onAdd={() => addItem(alergias, setAlergias, novaAlergia, setNovaAlergia, alergiaInputRef)}
                        inputRef={alergiaInputRef}
                    />
                    <TagList
                        items={alergias}
                        category="alergias"
                        onRemove={(index) => removeItem(alergias, setAlergias, index)}
                    />

                    {/* Cirurgias */}
                    <InputField
                        label="Cirurgias"
                        value={novaCirurgia}
                        onChange={(e) => setNovaCirurgia(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, cirurgias, setCirurgias, novaCirurgia, setNovaCirurgia, cirurgiaInputRef)}
                        onAdd={() => addItem(cirurgias, setCirurgias, novaCirurgia, setNovaCirurgia, cirurgiaInputRef)}
                        inputRef={cirurgiaInputRef}
                    />
                    <TagList
                        items={cirurgias}
                        category="cirurgias"
                        onRemove={(index) => removeItem(cirurgias, setCirurgias, index)}
                    />

                    {/* Atividade Física */}
                    <InputField
                        label="Atividade Física"
                        value={novaAtividadeFisica}
                        onChange={(e) => setNovaAtividadeFisica(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, atividadesFisicas, setAtividadesFisicas, novaAtividadeFisica, setNovaAtividadeFisica, atividadeInputRef)}
                        onAdd={() => addItem(atividadesFisicas, setAtividadesFisicas, novaAtividadeFisica, setNovaAtividadeFisica, atividadeInputRef)}
                        inputRef={atividadeInputRef}
                    />
                    <TagList
                        items={atividadesFisicas}
                        category="atividades"
                        onRemove={(index) => removeItem(atividadesFisicas, setAtividadesFisicas, index)}
                    />

                    {/* Perguntas Sim/Não */}
                    <div className="flex justify-between mt-6">
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Consome Álcool?</p>
                            <div className="flex space-x-3">
                                <button
                                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                                        consomeAlcool === 'Sim'
                                            ? 'bg-blue-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    onClick={() => setConsomeAlcool('Sim')}
                                >
                                    Sim
                                </button>
                                <button
                                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                                        consomeAlcool === 'Não'
                                            ? 'bg-blue-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    onClick={() => setConsomeAlcool('Não')}
                                >
                                    Não
                                </button>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">É fumante?</p>
                            <div className="flex space-x-3">
                                <button
                                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                                        eFumante === 'Sim'
                                            ? 'bg-blue-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    onClick={() => setEFumante('Sim')}
                                >
                                    Sim
                                </button>
                                <button
                                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                                        eFumante === 'Não'
                                            ? 'bg-blue-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    onClick={() => setEFumante('Não')}
                                >
                                    Não
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CondicoesClinicas;