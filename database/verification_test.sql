-- Test Query: Simulating OCR output with typos ("High Fructos Corn Sirup")
SELECT 
    i.id,
    i.canonical_name,
    similarity(i.canonical_name, 'High Fructos Corn Sirup') AS match_score
FROM ingredients i
WHERE similarity(i.canonical_name, 'High Fructos Corn Sirup') > 0.3

UNION

SELECT 
    i.id,
    i.canonical_name,
    similarity(a.alias_name, 'High Fructos Corn Sirup') AS match_score
FROM ingredient_aliases a
JOIN ingredients i ON a.ingredient_id = i.id
WHERE similarity(a.alias_name, 'High Fructos Corn Sirup') > 0.3
ORDER BY match_score DESC;