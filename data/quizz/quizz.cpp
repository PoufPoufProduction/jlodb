#include <string.h>
#include <stdlib.h>     /* srand, rand */
#include <time.h>       /* time */
#include <iostream>
#include <list>
#include <algorithm>

typedef enum {
	opeq	= 1,
	opnot	= 2,
	opleft	= 3,
	opright = 4,
	opnext	= 5,
	opfar	= 6
} op;

static unsigned int mapping[6][6] = { 1,2,3,4,5,6, 1,2,3,4,5,6, 1,2,3,4,5,6, 1,2,3,4,5,6, 1,2,3,4,5,6, 1,2,3,4,5,6 };
static char ops[5][5] 	 = { "eq","not","next","far","lt" };
static char types[5][10] = { "house","people","animal", "sport","food" };

void display(unsigned short *_c)
{
	std::cout<<"["<<_c[0]<<"] ";
	for (unsigned int i=1; i<_c[0]+1; i++) { std::cout<<_c[i]<<" "; }
	std::cout<<std::endl;
}

void display2(unsigned short *_c, unsigned int _width)
{
	unsigned int height = _c[0]/_width;
	std::cout<<",\"board\":[";

	for (unsigned int j=0; j<height; j++) {
		if (j!=0) { std::cout<<","; }
		std::cout<<"{\"type\":\""<<types[j]<<"\",";
		if (j==0) { std::cout<<"\"fixed\":\"true\","; }
		std::cout<<"\"value\":[";
		for (unsigned int i=0; i<_width; i++) {
			if (i!=0) { std::cout<<","; }
			std::cout<<mapping[j][_c[1+i+j*_width]];
		}
		std::cout<<"]}";
	}
	std::cout<<"]";
}

void rule(unsigned int _r) {
	unsigned int op = _r/10000;
	unsigned int e1 = (_r/100)%100;
	unsigned int e2 = _r%100;
	
	
	std::cout<<"[\""<<types[e1/10]<<mapping[e1/10][e1%10]<<"\",\""<<ops[op-1]<<"\",\""<<types[e2/10]<<mapping[e2/10][e2%10]<<"\"]";
}

bool check(unsigned short *_c, const std::list<unsigned int>& _rules, unsigned int _width)
{
	
	bool ret = true;
	for (std::list<unsigned int>::const_iterator it = _rules.begin(); it != _rules.end(); it++)
	{
		unsigned int v = *it;
		unsigned int op = v/10000;
		unsigned int e1 = (v/100)%100;
		unsigned int e2 = v%100;
		
		unsigned short y = (_c[0]-1)/_width;
		unsigned short x = (_c[0]-1)%_width;
		
		
		unsigned int c = (10*y+_c[_c[0]]);
		
		if (c==e1 || c==e2) {
			bool first = (c==e1);
			unsigned short o = first?e2:e1;
			unsigned int oy = o/10;
			bool tmp;
			
			switch(op) {
				case 1:	// EQ
					if (oy<y) {	if (_c[oy*_width+x+1] != o%10) { ret = false; } }
				break;
				case 4: // FAR
					if (oy<=y) {
						tmp = false;
						if (x<_width-1 && oy*_width+x+2<_c[0] ) { if ( _c[oy*_width+x+2] == o%10) { tmp = true; } } 
						if (x>0) { if (_c[oy*_width+x] == o%10) { tmp = true; } }
						if (tmp) { ret = false; }
					}
				case 2: // NOT
					if (oy<y) {	if (_c[oy*_width+x+1] == o%10) { ret = false; } }
				break;
				case 3: // NEXT
					if (oy<=y) {
						tmp = false;
						for (unsigned short ox=0; ox<x-1; ox++) {
							if (_c[oy*_width+ox+1] == o%10) { tmp = true; }
						}
						for (unsigned short ox=x+2; ox<_width; ox++) {
							if (oy*_width+ox+1<_c[0] && _c[oy*_width+ox+1] == o%10) { tmp = true; }
						}
						if (_c[oy*_width+x+1] == o%10) { tmp = true; }
						if (tmp) { ret = false; }
					}
				break;
				case 5: // LT
				{
					if (first) {
						if (x==_width-1) { ret = false; }
						else {
							if (oy<y) {
								tmp = false;
								for (unsigned short ox=0; ox<=x; ox++) {
									if (_c[oy*_width+ox+1] == o%10) { tmp = true; }
								}
								if (tmp) { ret = false; }
							}
						}
					}
					else {
						if (x==0) { ret = false; }
						else {
							if (oy<=y) {
								tmp = false;
								for (unsigned short ox=0; ox<x; ox++) {
									if (_c[oy*_width+ox+1] == o%10) { tmp = true; }
								}
								if (!tmp) { ret = false; }
							}
						}
					}
				}
				break;
			}
				
		}
		
		
	}
	
	return ret;
}

unsigned int results(std::list<unsigned short*>& goods, const std::list<unsigned int>& _rules, unsigned int _width, unsigned int _height)
{
	unsigned short * 	n;
	std::list<unsigned short*>	cc;
	
	n = new unsigned short[1+_width*_height];
	n[0] = _width;
	for (unsigned int i=0; i<_width; i++) { n[i+1] = i; }
	cc.push_back(n);
	
	while (cc.size())
	{
		unsigned short * c = cc.front();
		cc.pop_front();
		
		if (c[0]==_width*_height) {
			goods.push_back(c);
		}
		else {
			unsigned short y = c[0]/_width;
			unsigned short x = c[0]%_width;
			
			
			unsigned char  bitset = 0;
			for (unsigned int i=0; i<x; i++) { bitset |= (1<<c[1+y*_width+i]); }
			
			c[0]=c[0]+1;
			for (unsigned int i=0; i<_width; i++) {
				if ((bitset&(1<<i))==0) {
					c[c[0]]=i;
					if (check(c, _rules, _width)) {
						n = new unsigned short[1+_width*_height];
						memcpy(n,c,(c[0]+1)*sizeof(unsigned short));
						cc.push_back(n);
					}
				}
			}
			delete [] c;
			
		}
	}
	
	return goods.size();
}

unsigned int getrule(unsigned int _width,unsigned int _height)
{
	unsigned int op = (rand()%5)+1;
	unsigned int e1, e2;
	do {
		e1 = (rand()%_height)*10+(rand()%_width);
		e2 = (rand()%_height)*10+(rand()%_width);
	}
	while (e1==e2 || (e1<10 && e2<10) || (op==0 && e1/10==e2/10) || (op==1 && e1/10==e2/10) );
	return op*10000+e1*100+e2;
}

int main(int _argc, char ** _argv)
{
	srand (time(NULL));
	
	unsigned int sz = 0;
	unsigned int lastsz = 0;
	unsigned int cpt = 0;
	
	
	unsigned int 		width=5;
	unsigned int 		height=4; 
	unsigned int		nbrules = 14;
	
	unsigned int		total = 60;
	unsigned int		nb = 0;
	unsigned int		nbops[5] = { 0,0,0,0,0 };
	
	bool				test = false;
	bool				smalltips = true;
	unsigned int		nbtries = 100;
	
	while (nb<total) {
		
	for (unsigned int i=0; i<6; i++) { std::random_shuffle(&mapping[i][0], &mapping[i][6]); }
	
	do {
		std::list<unsigned int>	rules;
		for (unsigned int i=0; i<nbrules; i++) { rules.push_back(getrule(width, height)); }
		
		std::list<unsigned short*> goods;
		unsigned int cpt2 = 0;
		
		do {
			for (std::list<unsigned short*>::iterator it=goods.begin(); it!=goods.end(); it++) { delete * it; } 
			goods.clear();
			
			sz = results(goods, rules, width, height);
			cpt2++;
			
			if (lastsz==sz || sz==0) { if (rules.size()) { rules.pop_back(); } }
			else if (sz>1) { rules.push_back(getrule(width, height)); }
			lastsz = sz;
			
			
		} while (sz != 1 && cpt2<300); 
		
		
		if (sz==1) {
			// REMOVE NOT NECESSARY RULE
			unsigned rulesize = rules.size();
			for (unsigned int i=0; i<rulesize; i++) {
				unsigned int rule = rules.front();
				rules.pop_front();
				
				
				std::list<unsigned short*> stillgoods;
				sz = results(stillgoods, rules, width, height);
				if (sz!=1) { rules.push_back(rule); }
				
				for (std::list<unsigned short*>::iterator it=stillgoods.begin(); it!=stillgoods.end(); it++) { delete * it; } 
				
			}
			
			
			
			
			// PUBLISH
			for (unsigned int i=0; i<5; i++) { nbops[i] = 0; }
			for (std::list<unsigned int>::iterator i=rules.begin(); i!=rules.end(); i++) {
				nbops[((*i)/10000)-1]++;
			}
		
			
			std::cout<<"    <rdf:Description>"<<std::endl;
			std::cout<<"        <dct:identifier>o"<<(nb<9?"0":"")<<nb+1<<"</dct:identifier>"<<std::endl;
			std::cout<<"        <dct:title xml:lang=\"fr-FR\">Completer la grille en fonctions des énigmes ["<<rules.size()<<":"<<nbops[0]<<nbops[1]<<nbops[2]<<nbops[3]<<nbops[4]<<"].</dct:title>"<<std::endl;
			std::cout<<"        <dct:description><![CDATA[\"errratio\":3";
			if (smalltips) { std::cout<<",\"smalltips\":true"; }
			nb++;
			
			
			display2(*(goods.begin()),width);
			
			
			std::cout<<",\"tips\":[";
			for (std::list<unsigned int>::iterator r=rules.begin(); r!=rules.end(); r++) {
				if (r!=rules.begin()) { std::cout<<","; }
				rule(*r); }
			std::cout<<"]";
			
			std::cout<<"]]></dct:description>"<<std::endl;
			std::cout<<"        <dct:extent>2</dct:extent>"<<std::endl;
			std::cout<<"        <dct:subject>game</dct:subject>"<<std::endl;
			std::cout<<"        <dct:educationLevel>2</dct:educationLevel>"<<std::endl;
			std::cout<<"        <dct:type>2</dct:type>"<<std::endl;
			std::cout<<"    	<dct:alternative>o01</dct:alternative>"<<std::endl;
			std::cout<<"    </rdf:Description>"<<std::endl<<std::endl;
		}
		
		
		for (std::list<unsigned short*>::iterator it=goods.begin(); it!=goods.end(); it++) { delete * it; } 
			
		cpt++;
	}
	while (sz!=1 && cpt<nbtries && nb<total);
	
	
	if (test) { break; }
	
	
	}

	return 1;
}

