#include <string.h>
#include <stdlib.h>
#include <stdio.h>

#include <iostream>
#include <vector>
#include <map>
#include <string>
#include <algorithm>
#include <chrono>
#include <random>
#include <ctime>
#include <cstdlib>

static bool mixAvailable = true;
int         sideAvailable = 0xff;

int         sideVert      = 0x01;
int         sideDiag      = 0x02;
int         sideReverse   = 0x04;

float       diagratio       = 1.2;

std::map<std::string, int> alea;


int check(char * _grid, int _sx, int _sy, const std::string& word, int _x, int _y, int _ox, int _oy)
{
    int     ret = 0;
    bool    finish = false;
    int     id = 0;

    do {
        int x = _x+id*_ox, y =_y+id*_oy;
        if (x<0 || y<0 || x>=_sx || y>=_sy)                 { finish = true; ret = 0; } else
        if (_grid[x+y*_sx]!=0 && _grid[x+y*_sx]!=word[id])  { finish = true; ret = 0; } else
        {
            if (_grid[x+y*_sx]==0) { ret++; } else {
                if (mixAvailable) { ret+=5; } else { finish = true; ret = 0; }
            }
        }
        if (++id>=word.size()) { finish = true; }

    } while (!finish);

    if (ret==word.size()*5) { ret = -1; }

    if (ret) {
        ret=ret*100 + std::rand()%100;
        if (_ox!=0 && _oy!=0) { ret*=diagratio; }
    }

    //std::cout<<word<<"("<<_x<<","<<_y<<","<<_ox<<","<<_oy<<") "<<ret<<"("<<")"<<std::endl;

    return ret;
}


void place(char * _grid, int _sx, int _sy, const std::string& word, int _x, int _y, int _ox, int _oy)
{
    for (int id=0; id<word.size(); id++) {
        int x = _x+id*_ox, y =_y+id*_oy;
        _grid[x+y*_sx]=word[id];
    }
}

bool sort (const std::string& i, const std::string& j) {
    int diff=((i.size()+alea[i])-(j.size()+alea[j]));
    return (diff>0);
}

int main(int argc, char * argv[])
{
    unsigned int                argid   = 1;
    bool                        finish  = false;
    int                         sx = 5, sy = 5;
    char                        word[64];
    int                         wordlen = 0;
    std::vector<std::string>    corpus;
    std::map<std::string, std::string>  values;
    int                         count = 0;
    int                         finaldiag = 0, diag = 0;
    int                         finalcount = 0, finalwords = 0;
    bool                        verbose = false;
    int                         skip = 0;

    std::srand(std::time(0));

    do {
        if (!(finish=(argid>=argc))) {

            if (!strcmp(argv[argid],"-s") && (++argid<argc)) {
                sscanf(argv[argid],"%dx%d", &sx, &sy);
            } else if (!strcmp(argv[argid],"-nm")) {
                mixAvailable = false;
            } else if (!strcmp(argv[argid],"-a") && (++argid<argc)) {
                sideAvailable = atoi(argv[argid]);
            } else if (!strcmp(argv[argid],"-S") && (++argid<argc)) {
                skip = atoi(argv[argid]);
            } else if (!strcmp(argv[argid],"-d") && (++argid<argc)) {
                diagratio = atof(argv[argid]);
            } else if (!strcmp(argv[argid],"-v")) {
                verbose = true;
            }

        }
        argid++;
    } while(!finish);

    // FILL THE DATA FROM STDIN
    for (std::string line; std::getline(std::cin, line);) {
        if (line[0]!=';') {
            std::string             name, icon;
            std::string::size_type  loc = line.find( " ", 0 );


            if( loc != std::string::npos ) { name = line.substr(0,loc); icon = line.substr(loc+1, line.length() - loc); }
            else { name = line; icon = line; }

            if (name.length() && name[0]!=';')
            {
                std::string value;
                for (int i=0; i<name.length(); i++) {
                    std::string tmp = name.substr(i,2);
                    if (tmp=="É") { value.append("E"); i++; } else
                    if (tmp=="È") { value.append("E"); i++; } else
                    if (tmp=="Ê") { value.append("E"); i++; } else
                    if (tmp=="Î") { value.append("I"); i++; } else
                    if (tmp=="Ï") { value.append("I"); i++; } else
                    if (tmp=="Ô") { value.append("O"); i++; } else
                    if (tmp=="À") { value.append("A"); i++; } else
                    if (tmp=="Â") { value.append("A"); i++; } else
                    if (tmp=="Ù") { value.append("U"); i++; } else
                    if (tmp=="Ç") { value.append("C"); i++; } else
                    { value.append(name.substr(i,1)); }
                }

                std::string inverse;
                for (int i=value.length()-1; i>=0; i--) { inverse.append(value.substr(i,1)); }

                bool newvalueisok = true;
                for (std::vector<std::string>::const_iterator it = corpus.begin(); it!=corpus.end(); it++) {
                    if (it->find(value)!=std::string::npos)      { newvalueisok=false; if (verbose) std::cout<<"Warning : "<<value<<" - "<<*it<<std::endl; } else
                    if (it->find(inverse)!=std::string::npos)    { newvalueisok=false; if (verbose) std::cout<<"Warning : "<<value<<" - "<<*it<<std::endl; } else
                    if (value.find(*it)!=std::string::npos)      { newvalueisok=false; if (verbose) std::cout<<"Warning : "<<value<<" - "<<*it<<std::endl; } else
                    if (inverse.find(*it)!=std::string::npos)    { newvalueisok=false; if (verbose) std::cout<<"Warning : "<<value<<" - "<<*it<<std::endl; }
                }

                if (newvalueisok) {
                    corpus.push_back(value);
                    if (value.compare(name)) { values.insert(std::pair<std::string,std::string>(value,name)); }
                }
            }
        }
    }

    if (corpus.size()) {
        char * grid = (char*) malloc(sx*sy*sizeof(char));
        char * used = (char*) malloc(corpus.size()*sizeof(char));

        char * finalgrid = (char*) malloc(sx*sy*sizeof(char));
        std::string words;
        int holes, finalholes = -1;

        do {
            memset(grid, 0, sx*sy*sizeof(char));
            memset(used, 0, corpus.size()*sizeof(char));

            // MIXED AND SORTED
            alea.clear();
            for (int i=0; i<corpus.size(); i++) { alea.insert(std::pair<std::string, int>(corpus[i], rand()%5)); }
            unsigned seed = std::time(0);
            //shuffle(corpus.begin(), corpus.end(), std::default_random_engine(seed));
            std::sort(corpus.begin(), corpus.end(), sort);

            // for (int i=0; i<corpus.size(); i++) std::cout<<corpus[i]<<std::endl; break;

            diag = 0;
            for (int i=0; i<corpus.size(); i++)
            {
                if ((i>=skip)&&(i>corpus.size()/3 || rand()%(i/2+1)!=0)) {
                    int value = 0, px,py, ox,oy, v = 0;
                    for (int y=0; y<sy; y++) for (int x=0; x<sx; x++) {
                        if ( v!=-1 && (v=check(grid, sx, sy, corpus[i], x, y, 1, 0))>value)                                                     { value = v; px=x; py=y; ox=1; oy=0; }
                        if ( v!=-1 && (sideAvailable & sideReverse)  && (v=check(grid, sx, sy, corpus[i], x, y, -1, 0))>value)                  { value = v; px=x; py=y; ox=-1; oy=0; }
                        if ( v!=-1 && (sideAvailable & sideVert )    && (v=check(grid, sx, sy, corpus[i], x, y, 0, 1))>value)                   { value = v; px=x; py=y; ox=0; oy=1; }
                        if ( v!=-1 && ((sideAvailable & (sideVert | sideReverse))==(sideVert | sideReverse)) && (v=check(grid, sx, sy, corpus[i], x, y, 0, -1))>value)    { value = v; px=x; py=y; ox=0; oy=-1; }
                        if ( v!=-1 && (sideAvailable & sideDiag ) && (v=check(grid, sx, sy, corpus[i], x, y, 1, 1))>value)                    { value = v; px=x; py=y; ox=1; oy=1;  }
                        if ( v!=-1 && ((sideAvailable & (sideDiag | sideVert))==(sideDiag | sideVert)) && (v=check(grid, sx, sy, corpus[i], x, y, -1, 1))>value)         { value = v; px=x; py=y; ox=-1; oy=1;  }
                        if ( v!=-1 && ((sideAvailable & (sideDiag | sideReverse))==(sideDiag | sideReverse)) && (v=check(grid, sx, sy, corpus[i], x, y, 1, -1))>value)       { value = v; px=x; py=y; ox=1; oy=-1; }
                        if ( v!=-1 && ((sideAvailable & (sideDiag | sideReverse))==(sideDiag | sideReverse)) && (v=check(grid, sx, sy, corpus[i], x, y, -1,-1))>value)       { value = v; px=x; py=y; ox=-1; oy=-1; }
                    }


                    if (v!=-1 && value) {
                        place(grid, sx, sy, corpus[i], px,py,ox,oy);
                        if (ox!=0 && oy!=0) {  diag++; }
                        used[i] = 1;
                    }
                    if (v==-1) { break; }
                    
                    holes=0;
                    for (int y=0; y<sy; y++) for (int x=0; x<sx; x++) if (!grid[x+y*sx]) holes++;
                    if (holes==0) { break; }
                }
            }
            count++;

            if (finalholes==-1 || finalholes>holes) {
                finaldiag = diag;
                finalholes = holes;
                finalcount = 0;
                finalwords = 0;
                memcpy(finalgrid, grid, sx*sy*sizeof(char));
                words="";
                for (int i=0; i<corpus.size(); i++) { if (used[i]) {
                    if (words.size()){ words.append(",");}
                    finalcount+=corpus[i].size(); finalwords++;
                    std::map<std::string,std::string>::iterator it = values.find(corpus[i]);
                    if (it==values.end()) {
                        words.append("\""); words.append(corpus[i]); words.append("\"");
                    }
                    else {
                        words.append("[\""); words.append(it->second); words.append("\",");
                        words.append("\""); words.append(it->first); words.append("\"]");
                    }
                } }
            }

        }
        while(count<100000 && finalholes!=0);

        
        for (int i=0; i<corpus.size(); i++) { if (used[i]) {
            int cc = 0;
            for (int y=0; y<sy; y++) for (int x=0; x<sx; x++) {
                if ( check(finalgrid, sx, sy, corpus[i], x, y, 1, 0))    { cc++; }
                if ( check(finalgrid, sx, sy, corpus[i], x, y, -1, 0))   { cc++; }
                if ( check(finalgrid, sx, sy, corpus[i], x, y, 0, 1))    { cc++; }
                if ( check(finalgrid, sx, sy, corpus[i], x, y, 0, -1))   { cc++; }
                if ( check(finalgrid, sx, sy, corpus[i], x, y, 1, 1))    { cc++; }
                if ( check(finalgrid, sx, sy, corpus[i], x, y, -1, 1))   { cc++; }
                if ( check(finalgrid, sx, sy, corpus[i], x, y, 1, -1))   { cc++; }
                if ( check(finalgrid, sx, sy, corpus[i], x, y, -1,-1))   { cc++; }
            }
            if (cc>1) { std::cout<<"WARNING : "<<corpus[i]<<"("<<cc<<")"<<std::endl; }
        }
        }
        
       
        for (int y=0; y<sy; y++) {
            if (y) { std::cout<<",\""; } else { std::cout<<std::endl<<"\"grid\":[\""; }
            for (int x=0; x<sx; x++) {
                if (finalgrid[x+y*sx]) { std::cout<<finalgrid[x+y*sx]; } else { std::cout<<"."; }
            }
            std::cout<<"\"";
        }
        std::cout<<"],\"legend\":["<<words<<"]"<<std::endl;
        std::cout<<"(corpus: "<<corpus.size()<<") (holes: "<<finalholes<<") (count: "<<count<<") ("<<finaldiag<<"/"<<finalwords<<"|"<<finalcount<<"/"<<(sx*sy)<<")"<<std::endl;
        

        delete grid; delete used; delete finalgrid;
    }

}


