#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <stdarg.h>
#include <iostream>
#include <iomanip>
#include <time.h>
#include <sys/time.h>
#include <math.h>
#include <vector>
#include <list>


int main(int argc, char * argv[])
{
    unsigned int    argid   = 1;
    bool            finish  = false;
    bool            error   = 0;
    int             sx = 16, sy = 12;
    int             min = 0;

    do {
        if (!(finish=(argid>=argc))) {

            
            //if (!strcmp(argv[argid],"-s") && (++argid<argc))    { sscanf(argv[argid],"%dx%d", &sx, &sy); }  else
            if (!strcmp(argv[argid],"-m") && (++argid<argc))    { min = atoi(argv[argid]); }                else
                                                                { error = true; }
        }
        argid++;
    } while(!finish);

    if (error) {
        std::cout<<"MAZE @poufpoufproduction 2015"<<std::endl;
        std::cout<<"[usage] maze -s [integer]x[integer] -m [integer]"<<std::endl;
        return 0;
    }
    
    return 1;
}