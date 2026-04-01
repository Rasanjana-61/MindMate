import React, { useState } from 'react';
import './App.css';

function ResourceHub() {
    const [activeFilter, setActiveFilter] = useState('EBook');
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    const resources = [
        { id: 1, type: 'EBook', title: 'Social Media Guide', image: '/resource_thumb_1.png' },
        { id: 2, type: 'Video', title: 'Modern Marketing', image: '/resource_thumb_2.png' },
        { id: 3, type: 'PDF', title: 'Digital Strategy', image: '/resource_thumb_3.png' },
        { id: 4, type: 'EBook', title: 'Design Principles', image: '/resource_thumb_4.png' }
    ];

    const filters = ['EBook', 'Video', 'PDF'];

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        // Allows only alphanumeric and spaces
        const regex = /^[a-zA-Z0-9 ]*$/;

        if (regex.test(value)) {
            setSearchQuery(value);
            setError('');
        } else {
            setError('Special characters are not allowed!');
            triggerShake();
        }
    };

    const filteredResources = resources.filter(res => 
        (res.type === activeFilter) && 
        res.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="resource-hub-page">
            <nav className="resource-hub-nav">
                <button onClick={() => window.history.back()} className="nav-back-btn">
                    ← Dashboard
                </button>
            </nav>

            <header className="resource-hub-header">
                <h1 className="resource-hub-title">Resource Center</h1>
                <p className="resource-hub-subtitle">
                    This is a subheader. You might want to put a thought here to engage visitors. For example, this is a template from Brand Builder Solutions.
                </p>
            </header>

            <main className="resource-hub-container">
                <div className="resource-hub-controls">
                    <div className="filter-buttons">
                        {filters.map(filter => (
                            <button 
                                key={filter} 
                                className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="hub-actions">
                        <button className="add-resource-btn">ADD</button>
                        <div className="search-bar-container" style={{ position: 'relative' }}>
                            <div className={`hub-search-group ${isShaking ? 'shake' : ''} ${error ? 'input-error' : ''}`} style={{ display: 'flex', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="hub-search-input"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                />
                                <button className="search-icon-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </button>
                            </div>
                            {error && (
                                <div style={{ 
                                    position: 'absolute', 
                                    bottom: '-22px', 
                                    left: '10px', 
                                    color: '#ef4444', 
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    animation: 'fadeIn 0.2s ease-in-out',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="resource-grid">
                    {filteredResources.length > 0 ? (
                        filteredResources.map(resource => (
                            <div key={resource.id} className="resource-card">
                                <div className="resource-image-container">
                                    <img src={resource.image} alt={resource.title} className="resource-image" />
                                </div>
                                <div className="resource-info">
                                    <p className="resource-title-text">{resource.title} Grows Here</p>
                                    <button className="download-hub-btn">DOWNLOAD</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-resources">No resources found matching your criteria.</div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default ResourceHub;
