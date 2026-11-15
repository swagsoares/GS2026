import sys, json, fitz
pdf, saida = sys.argv[1], sys.argv[2]
titulos = json.load(open("titulos.json", encoding="utf-8"))
doc = fitz.open(pdf)
linhas = [[l.strip() for l in pg.get_text().splitlines() if l.strip()] for pg in doc]
ini = next(i for i, ls in enumerate(linhas) if "1 INTRODUÇÃO" in ls and "SUMÁRIO" not in ls)
res = {"__inicio": ini}  # página física ini+1 recebe o número ini (capa não é contada)
for t in titulos:
    for i in range(ini, len(linhas)):
        if t in linhas[i]:
            res[t] = i  # número exibido = física - 1
            break
    else:
        print("não achei:", t)
json.dump(res, open(saida, "w", encoding="utf-8"), ensure_ascii=False)
print("páginas:", len(doc), "| introdução na física", ini + 1, "| último:", list(res.items())[-1])
